/**
 * Industrial SSE - Bun-only, in-memory default, pluggable to Redis/storage
 * Pattern similar to `StorageDriver` in `upload.ts` - default Memory, swap to Redis by injecting.
 */

export interface SSEMessage {
	/** Event name */
	event?: string;
	/** Message data */
	data: string | object;
	/** Unique message ID for resumption */
	id?: string | number;
}

// ── Pluggable History Store (similar to StorageDriver) ──
export interface SSEHistoryStore {
	/** Persist message (called on every send with an id) */
	add(message: SSEMessage): Promise<void> | void;
	/** Fetch messages after lastEventId */
	getAfter(lastEventId: string): Promise<SSEMessage[]> | SSEMessage[];
	/** Optional clear */
	clear?(): Promise<void> | void;
}

/** Default in-memory ring buffer 1000 msg - zero-deps */
export class MemorySSEHistory implements SSEHistoryStore {
	private messages: SSEMessage[] = [];
	constructor(private maxSize = 1000) {}
	add(message: SSEMessage): void {
		// only keep messages that have an id (replay needs an id)
		if (message.id === undefined) return;
		this.messages.push({ ...message });
		if (this.messages.length > this.maxSize) this.messages.shift();
	}
	getAfter(lastEventId: string): SSEMessage[] {
		const idx = this.messages.findIndex((m) => String(m.id) === String(lastEventId));
		if (idx === -1) return [];
		return this.messages.slice(idx + 1);
	}
	clear(): void {
		this.messages = [];
	}
}

// ── Pluggable PubSub (for cluster broadcast) ──
export interface SSEPubSub {
	publish(channel: string, message: SSEMessage): Promise<void> | void;
	subscribe(channel: string, handler: (msg: SSEMessage) => void): () => void;
}

export class MemorySSEPubSub implements SSEPubSub {
	private channels = new Map<string, Set<(msg: SSEMessage) => void>>();
	publish(channel: string, message: SSEMessage): void {
		const subs = this.channels.get(channel);
		if (!subs) return;
		for (const cb of subs) {
			try {
				cb(message);
			} catch {}
		}
	}
	subscribe(channel: string, handler: (msg: SSEMessage) => void): () => void {
		let set = this.channels.get(channel);
		if (!set) {
			set = new Set();
			this.channels.set(channel, set);
		}
		set.add(handler);
		return () => set!.delete(handler);
	}
}

export interface SSEOptions {
	/** Send initial connection event */
	sendInitial?: boolean;
	/** Custom event name for initial connection */
	initialEvent?: string;
	/** Retry timeout in milliseconds (client reconnection) - default 3000 */
	retry?: number;
	/**
	 * Maximum number of concurrent SSE connections.
	 * When exceeded, new connections receive 503 Service Unavailable.
	 * Set to 0 for unlimited (default).
	 */
	maxConnections?: number;
	/**
	 * Callback to replay missed events on reconnection.
	 * Receives the Last-Event-ID header value from the client.
	 * Return an array of messages to replay.
	 * If `historyStore` is provided, this callback is optional - the store is used automatically.
	 */
	onReconnect?: (lastEventId: string) => Promise<SSEMessage[]>;
	/** Pluggable history store - default MemorySSEHistory (similar to StorageDriver) */
	historyStore?: SSEHistoryStore;
	/** Additional custom headers */
	headers?: Record<string, string>;
}

/**
 * Global connection tracker for maxConnections enforcement.
 */
const connectionTracker = {
	connections: new Set<SSE>(),
};

// Global default history (used when options.historyStore is not set)
const defaultHistory = new MemorySSEHistory(1000);

export class SSE {
	private controller: ReadableStreamDefaultController | null = null;
	private encoder = new TextEncoder();
	private closed = false;
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	private lastEventId: string | null = null;
	private abortHandler: (() => void) | null = null;
	private historyStore: SSEHistoryStore;

	constructor(
		private request: Request,
		private options: SSEOptions = {},
	) {
		// Capture Last-Event-ID header (case-insensitive) + query fallback for proxies
		const headerId = request.headers.get("last-event-id");
		const url = new URL(request.url);
		const queryId = url.searchParams.get("lastEventId") || url.searchParams.get("last-event-id");
		this.lastEventId = headerId || queryId;
		this.historyStore = options.historyStore ?? defaultHistory;
		// Pre-aborted check
		if (request.signal.aborted) {
			this.closed = true;
		}
	}

	/**
	 * Create SSE response with ReadableStream - Bun-only, no external deps
	 */
	connect(): Response {
		if (this.closed && this.request.signal.aborted) {
			return new Response(null, { status: 409 });
		}
		// Check maxConnections limit
		const maxConnections = this.options.maxConnections ?? 0;
		if (maxConnections > 0 && connectionTracker.connections.size >= maxConnections) {
			return new Response(
				JSON.stringify({
					error: "Service Unavailable",
					message: "Maximum connections reached. Please try again later.",
				}),
				{
					status: 503,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Track this connection
		connectionTracker.connections.add(this);

		const stream = new ReadableStream({
			start: (controller) => {
				this.controller = controller;

				// Send initial connection event
				if (this.options.sendInitial !== false) {
					const eventName = this.options.initialEvent || "connected";
					this.sendMessage({ event: eventName, data: "connected" });
				}

				// Send retry timeout - default 3000 when unset (what clients expect)
				if (this.options.retry !== undefined) {
					this.sendRaw(`retry: ${this.options.retry}\n\n`);
				} else {
					this.sendRaw(`retry: 3000\n\n`);
				}

				// Start heartbeat 30s fixed (industrial keep-alive)
				this.startHeartbeat();

				// Handle client disconnect - once:true + cleanup
				this.abortHandler = () => this.close();
				this.request.signal.addEventListener("abort", this.abortHandler, { once: true } as AddEventListenerOptions);

				// Replay missed events on reconnection - store first, fallback to onReconnect
				if (this.lastEventId) {
					// async without blocking the initial event
					queueMicrotask(() => this.replayMissedEvents());
				}
			},
			cancel: () => {
				this.close();
			},
		});

		const headers: Record<string, string> = {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no", // Disable nginx buffering
			"Content-Encoding": "none",
			"Cache-Control2": "no-cache", // compat
			...this.options.headers,
		};
		// Explicit Transfer-Encoding chunked is unnecessary in Bun (auto), but keep the header for proxies
		return new Response(stream, {
			status: 200,
			headers: {
				"Content-Type": "text/event-stream; charset=utf-8",
				"Cache-Control": "no-cache, no-transform",
				Connection: "keep-alive",
				"X-Accel-Buffering": "no",
				...this.options.headers,
			},
		});
	}

	/**
	 * Replay missed events from reconnection via historyStore / onReconnect
	 */
	private async replayMissedEvents(): Promise<void> {
		if (!this.lastEventId) return;

		try {
			let missed: SSEMessage[] = [];
			// Priority: historyStore → onReconnect
			if (this.historyStore) {
				const fromStore = await this.historyStore.getAfter(this.lastEventId);
				if (fromStore && fromStore.length > 0) missed = fromStore;
			}
			if (missed.length === 0 && this.options.onReconnect) {
				const fromCb = await this.options.onReconnect(this.lastEventId);
				if (fromCb) missed = fromCb;
			}
			for (const event of missed) {
				this.send(event);
			}
		} catch (error) {
			console.error("SSE reconnect replay error:", error);
		}
	}

	/**
	 * Send a message to the client - auto-persists to historyStore when it has an id
	 */
	send(message: SSEMessage): void {
		if (this.closed) return;
		// persist first for replay
		if (message.id !== undefined) {
			try {
				const r = this.historyStore.add(message);
				if (r instanceof Promise) r.catch(() => {});
			} catch {}
		}
		this.sendMessage(message);
	}

	/**
	 * Send a simple data message
	 */
	sendData(data: string | object): void {
		this.send({ data });
	}

	/**
	 * Send a named event
	 */
	sendEvent(event: string, data: string | object): void {
		this.send({ event, data });
	}

	/**
	 * Send a message with ID (for resumption)
	 */
	sendWithId(id: string | number, data: string | object): void {
		this.send({ id, data });
	}

	/**
	 * Send SSE comment - for custom heartbeats
	 */
	sendComment(comment: string): void {
		const sanitized = String(comment).replace(/[\r\n]/g, " ");
		this.sendRaw(`: ${sanitized}\n\n`);
	}

	private disconnectCallbacks: Set<() => void> = new Set();

	/**
	 * Register a callback to be called when the connection closes
	 */
	onClose(callback: () => void): void {
		this.disconnectCallbacks.add(callback);
	}

	offClose(callback: () => void): void {
		this.disconnectCallbacks.delete(callback);
	}

	/**
	 * Get the Last-Event-ID header value (for reconnection)
	 */
	getLastEventId(): string | null {
		return this.lastEventId;
	}

	/**
	 * Send raw string to the stream - with backpressure check
	 */
	private sendRaw(raw: string): void {
		if (this.closed || !this.controller) return;
		// Backpressure: desiredSize <=0 means the buffer is full → drop or wait
		try {
			const desired = (this.controller as unknown as { desiredSize?: number | null }).desiredSize;
			if (desired !== null && desired !== undefined && desired <= 0) {
				if (raw.startsWith(":")) return; // drop heartbeat when full - do not warn
			}
			this.controller.enqueue(this.encoder.encode(raw));
		} catch (_error) {
			this.close();
		}
	}

	/**
	 * Validate event/id to keep the spec intact (no \r \n \0)
	 */
	private sanitizeField(value: string): string {
		if (/[\r\n\0]/.test(value)) throw new Error(`Invalid SSE field contains newline: ${value}`);
		return value;
	}

	/**
	 * Format and send SSE message - sanitized
	 */
	private sendMessage(message: SSEMessage): void {
		let raw = "";

		if (message.id !== undefined) {
			const idStr = String(message.id);
			this.sanitizeField(idStr);
			raw += `id: ${idStr}\n`;
		}
		if (message.event) {
			this.sanitizeField(message.event);
			raw += `event: ${message.event}\n`;
		}

		let data: string;
		if (typeof message.data === "object") {
			if (message.data === null) data = "null";
			else data = JSON.stringify(message.data);
		} else {
			data = String(message.data);
		}

		// SSE spec: data cannot contain single \n, split into multiple data: lines, handle \r\n
		const dataLines = data.split(/\r\n|\r|\n/);
		for (const line of dataLines) {
			raw += `data: ${line}\n`;
		}

		raw += "\n";
		this.sendRaw(raw);
	}

	/**
	 * Start heartbeat 30s fixed - keep-alive for LB/ALB
	 */
	private startHeartbeat(): void {
		// 30s fixed per spec - not configurable per request (industrial default)
		this.heartbeatInterval = setInterval(() => {
			this.sendRaw(": heartbeat\n\n");
		}, 30000);
	}

	/**
	 * Close the SSE connection - idempotent + cleanup listener
	 */
	close(): void {
		if (this.closed) return;
		this.closed = true;

		// Remove from global tracker
		connectionTracker.connections.delete(this);

		for (const cb of this.disconnectCallbacks) {
			try {
				cb();
			} catch (e) {
				console.error("SSE onClose error:", e);
			}
		}
		this.disconnectCallbacks.clear();

		if (this.abortHandler) {
			try {
				this.request.signal.removeEventListener("abort", this.abortHandler);
			} catch {}
			this.abortHandler = null;
		}

		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		if (this.controller) {
			try {
				this.controller.close();
			} catch (_e) {}
			this.controller = null;
		}
	}

	/**
	 * Check if connection is still open
	 */
	get isConnected(): boolean {
		return !this.closed;
	}

	/**
	 * Get the number of active SSE connections
	 */
	static get activeConnections(): number {
		return connectionTracker.connections.size;
	}

	/**
	 * Get all active SSE connections
	 */
	static getActiveConnections(): ReadonlySet<SSE> {
		return connectionTracker.connections;
	}

	/** Graceful close all - used in Buntok.setupGracefulShutdown */
	static closeAll(): void {
		for (const c of [...connectionTracker.connections]) c.close();
	}
}

/**
 * SSE Broadcaster - in-memory default, pluggable to Redis via pubSub
 *
 * @example Memory (default)
 * ```ts
 * const broadcaster = new SSEBroadcaster();
 * app.get("/events", (ctx) => { const sse = createSSE(ctx.request); broadcaster.add(sse); sse.onClose(()=>broadcaster.remove(sse)); return sse.connect(); })
 * broadcaster.broadcast("update", {count:42})
 * ```
 * @example Redis pluggable (similar to StorageDriver)
 * ```ts
 * class RedisSSEPubSub implements SSEPubSub { constructor(private redis: Redis){} publish(ch,msg){ redis.publish(ch, JSON.stringify(msg)) } subscribe(ch,cb){ redis.subscribe(ch,(m)=>cb(JSON.parse(m))); return ()=>redis.unsubscribe(ch)} }
 * const broadcaster = new SSEBroadcaster({ pubSub: new RedisSSEPubSub(redis), channel: "buntok:sse" })
 * ```
 */
export interface SSEBroadcasterOptions {
	pubSub?: SSEPubSub;
	channel?: string;
	historyStore?: SSEHistoryStore;
}
export class SSEBroadcaster {
	private clients = new Set<SSE>();
	private pubSub?: SSEPubSub;
	private channel: string;
	private historyStore?: SSEHistoryStore;
	private unsubscribe?: () => void;

	constructor(opts?: SSEBroadcasterOptions | SSEPubSub) {
		// backward compat: new SSEBroadcaster(pubSub)
		if (opts && typeof (opts as SSEPubSub).publish === "function" && typeof (opts as SSEPubSub).subscribe === "function") {
			this.pubSub = opts as SSEPubSub;
			this.channel = "buntok:sse";
		} else {
			const o = opts as SSEBroadcasterOptions | undefined;
			this.pubSub = o?.pubSub;
			this.channel = o?.channel ?? "buntok:sse";
			this.historyStore = o?.historyStore;
		}
		if (this.pubSub) {
			this.unsubscribe = this.pubSub.subscribe(this.channel, (msg) => {
				// fan-out to local clients without another publish loop
				for (const c of [...this.clients]) {
					if (c.isConnected) c.send(msg);
					else this.clients.delete(c);
				}
			});
		}
	}

	/**
	 * Add an SSE connection to the broadcaster
	 */
	add(sse: SSE): void {
		this.clients.add(sse);
	}

	/**
	 * Remove an SSE connection from the broadcaster
	 */
	remove(sse: SSE): void {
		this.clients.delete(sse);
	}

	/**
	 * Broadcast a named event to all connected clients - via pubSub when available
	 */
	broadcast(event: string, data: string | object): void {
		const msg: SSEMessage = { event, data };
		if (this.pubSub) {
			const r = this.pubSub.publish(this.channel, msg);
			if (r instanceof Promise) r.catch(() => this.localBroadcast(msg));
			else this.localBroadcast(msg);
			return;
		}
		this.localBroadcast(msg);
	}

	private localBroadcast(msg: SSEMessage): void {
		for (const client of [...this.clients]) {
			if (client.isConnected) {
				client.send(msg as SSEMessage);
			} else {
				this.clients.delete(client);
			}
		}
	}

	/**
	 * Broadcast to clients matching a predicate
	 */
	broadcastWhere(
		predicate: (sse: SSE) => boolean,
		event: string,
		data: string | object,
	): void {
		const msg: SSEMessage = { event, data };
		// when pubSub is present, still filter locally (predicates cannot be remote)
		for (const client of [...this.clients]) {
			if (!client.isConnected) {
				this.clients.delete(client);
				continue;
			}
			if (predicate(client)) {
				client.send(msg);
			}
		}
	}

	/**
	 * Send a message to all connected clients
	 */
	sendAll(message: SSEMessage): void {
		if (this.pubSub) {
			const r = this.pubSub.publish(this.channel, message);
			if (r instanceof Promise) r.catch(() => this.localSendAll(message));
			else this.localSendAll(message);
			return;
		}
		this.localSendAll(message);
	}
	private localSendAll(message: SSEMessage): void {
		for (const client of [...this.clients]) {
			if (client.isConnected) client.send(message);
			else this.clients.delete(client);
		}
	}

	/**
	 * Close all connections + unsubscribe pubSub
	 */
	closeAll(): void {
		if (this.unsubscribe) {
			try { this.unsubscribe(); } catch {}
			this.unsubscribe = undefined;
		}
		for (const client of [...this.clients]) {
			client.close();
		}
		this.clients.clear();
	}

	/**
	 * Get the number of connected clients
	 */
	get size(): number {
		// Clean up disconnected clients
		for (const client of [...this.clients]) {
			if (!client.isConnected) {
				this.clients.delete(client);
			}
		}
		return this.clients.size;
	}

	/**
	 * Check if there are any connected clients
	 */
	get isEmpty(): boolean {
		return this.size === 0;
	}
}

/**
 * Create SSE helper from Buntok context - Bun-only
 */
export function createSSE(request: Request, options?: SSEOptions): SSE {
	return new SSE(request, options);
}
