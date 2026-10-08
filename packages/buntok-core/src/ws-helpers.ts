import type { ServerWebSocket } from "bun";
import { z } from "zod";
import type { WSData, WSHandler } from "./buntok";

// Extended WSData with heartbeat
interface WSDataWithHeartbeat<DI> extends WSData<DI> {
	heartbeat?: {
		interval: number;
		timer: ReturnType<typeof setInterval> | null;
		alive: boolean;
	};
}

// ── Pluggable PubSub (similar to StorageDriver) ──
export interface WSPubSub {
	/** Publish to a channel - memory default, Redis pluggable */
	publish(channel: string, message: string | object): Promise<void> | void;
	/** Subscribe - return unsubscribe */
	subscribe(channel: string, handler: (message: string | object) => void): () => void;
}

export class MemoryWSPubSub implements WSPubSub {
	private channels = new Map<string, Set<(m: string | object) => void>>();
	publish(channel: string, message: string | object): void {
		const subs = this.channels.get(channel);
		if (!subs) return;
		for (const cb of subs) {
			try { cb(message); } catch {}
		}
	}
	subscribe(channel: string, handler: (m: string | object) => void): () => void {
		let set = this.channels.get(channel);
		if (!set) { set = new Set(); this.channels.set(channel, set); }
		set.add(handler);
		return () => set!.delete(handler);
	}
}

// ── Rate limit store pluggable ──
export interface WSRateLimitStore {
	incr(key: string, windowMs: number): Promise<number> | number;
}

export class MemoryWSRateLimitStore implements WSRateLimitStore {
	private map = new Map<string, { count: number; resetAt: number }>();
	incr(key: string, windowMs: number): number {
		const now = Date.now();
		const ent = this.map.get(key);
		if (!ent || now > ent.resetAt) {
			this.map.set(key, { count: 1, resetAt: now + windowMs });
			return 1;
		}
		ent.count++;
		return ent.count;
	}
}

/**
 * Validate a WebSocket message against a Zod schema.
 */
export function validateWSMessage<T>(
	schema: z.ZodSchema<T>,
	message: string | Buffer,
): { success: true; data: T } | { success: false; errors: z.ZodError } {
	const raw = typeof message === "string" ? message : message.toString();

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return {
			success: false,
			errors: new z.ZodError([
				{
					code: "custom",
					message: "Invalid JSON",
					path: [],
				},
			]),
		};
	}

	const result = schema.safeParse(parsed);
	if (result.success) {
		return { success: true, data: result.data };
	}
	return { success: false, errors: result.error };
}

/**
 * Room class - in-memory default, pluggable to Redis via pubSub.
 * Similar to the LocalDiskStorage vs MemoryStorage pattern.
 *
 * @example Memory (default)
 * ```ts
 * const room = new Room("chat");
 * app.ws("/chat", { open: (ws)=> room.join(ws), message: (ws,msg)=> room.broadcast(msg, ws) })
 * ```
 * @example Redis (pluggable)
 * ```ts
 * class RedisWSPubSub implements WSPubSub { constructor(private redis: Redis){} publish(ch,msg){ redis.publish(ch, typeof msg==="object"?JSON.stringify(msg):msg as string)} subscribe(ch,cb){ redis.subscribe(ch,(m)=>cb(m)); return ()=>redis.unsubscribe(ch)} }
 * const room = new Room("chat", { pubSub: new RedisWSPubSub(redis) })
 * ```
 */
export interface RoomOptions {
	pubSub?: WSPubSub;
	channel?: string;
}
export class Room<DI = Record<string, unknown>> {
	public readonly name: string;
	private members = new Set<ServerWebSocket<WSData<DI>>>();
	private pubSub?: WSPubSub;
	private channel: string;
	private unsubscribe?: () => void;

	constructor(name: string, opts?: RoomOptions | WSPubSub) {
		this.name = name;
		if (opts && typeof (opts as WSPubSub).publish === "function") {
			this.pubSub = opts as WSPubSub;
			this.channel = `buntok:ws:${name}`;
		} else {
			const o = opts as RoomOptions | undefined;
			this.pubSub = o?.pubSub;
			this.channel = o?.channel ?? `buntok:ws:${name}`;
		}
		if (this.pubSub) {
			this.unsubscribe = this.pubSub.subscribe(this.channel, (msg) => {
				const data = typeof msg === "object" ? JSON.stringify(msg) : (msg as string);
				for (const m of [...this.members]) {
					if (m.readyState === 1) {
						try { m.send(data); } catch {}
					}
				}
			});
		}
	}

	join(ws: ServerWebSocket<WSData<DI>>): void {
		this.members.add(ws);
		// Also Bun native subscribe for kernel fan-out (optional, not required when using pubSub)
		try { (ws as unknown as { subscribe?: (c:string)=>void }).subscribe?.(this.channel); } catch {}
	}

	leave(ws: ServerWebSocket<WSData<DI>>): void {
		this.members.delete(ws);
		try { (ws as unknown as { unsubscribe?: (c:string)=>void }).unsubscribe?.(this.channel); } catch {}
	}

	broadcast(message: string | object, exclude?: ServerWebSocket<WSData<DI>>): void {
		if (this.pubSub) {
			// via pubSub (Redis) - fans out to all instances including self via subscribe
			const r = this.pubSub.publish(this.channel, message);
			if (r instanceof Promise) r.catch(() => this.localBroadcast(message, exclude));
			return;
		}
		this.localBroadcast(message, exclude);
	}

	private localBroadcast(message: string | object, exclude?: ServerWebSocket<WSData<DI>>): void {
		const data = typeof message === "object" ? JSON.stringify(message) : message;
		// Backpressure check: if bufferedAmount is high, skip the slow client
		for (const member of [...this.members]) {
			if (member !== exclude && member.readyState === 1) {
				try {
					const buffered = (member as unknown as { getBufferedAmount?: () => number }).getBufferedAmount?.() ?? 0;
					if (buffered > 1024 * 1024) continue; // drop when >1MB buffered
					member.send(data);
				} catch {}
			}
		}
	}

	sendAll(message: string | object): void {
		this.broadcast(message);
	}

	getMembers(): ServerWebSocket<WSData<DI>>[] {
		return Array.from(this.members);
	}

	get size(): number {
		return this.members.size;
	}

	get isEmpty(): boolean {
		return this.members.size === 0;
	}

	has(ws: ServerWebSocket<WSData<DI>>): boolean {
		return this.members.has(ws);
	}

	closeAll(): void {
		if (this.unsubscribe) { try { this.unsubscribe(); } catch {} }
		for (const member of [...this.members]) {
			try { member.close(1000, "Room closed"); } catch {}
		}
		this.members.clear();
	}

	/** Filtered broadcast mirip SSEBroadcaster.broadcastWhere */
	broadcastWhere(predicate: (ws: ServerWebSocket<WSData<DI>>) => boolean, message: string | object): void {
		const data = typeof message === "object" ? JSON.stringify(message) : message;
		for (const member of [...this.members]) {
			if (member.readyState !== 1) continue;
			if (predicate(member)) {
				try { member.send(data); } catch {}
			}
		}
	}
}

/**
 * WebSocket heartbeat - 30s fixed, Bun-only
 * Fix: pong event resets alive (not message/drain)
 */
export function wsHeartbeat<DI = Record<string, unknown>>(
	interval = 30_000,
): WSHandler<DI> {
	return {
		open: (ws: ServerWebSocket<WSData<DI>>) => {
			const wsData = ws.data as WSDataWithHeartbeat<DI>;
			wsData.heartbeat = {
				interval,
				timer: null as ReturnType<typeof setInterval> | null,
				alive: true,
			};
			wsData.heartbeat.timer = setInterval(() => {
				const hb = (ws.data as WSDataWithHeartbeat<DI>).heartbeat;
				if (!hb) return;
				if (!hb.alive) {
					try { ws.close(4000, "Heartbeat timeout"); } catch {}
					return;
				}
				hb.alive = false;
				try { ws.ping(); } catch {}
			}, interval);
		},
		// Dedicated `pong` handler - wired in buntok.ts websocket.pong
		// Fallback for older Bun versions: message also resets (compat)
		message: (ws: ServerWebSocket<WSData<DI>>) => {
			const wsData = ws.data as WSDataWithHeartbeat<DI>;
			if (wsData.heartbeat) wsData.heartbeat.alive = true;
		},
		close: (ws: ServerWebSocket<WSData<DI>>) => {
			const wsData = ws.data as WSDataWithHeartbeat<DI>;
			if (wsData.heartbeat?.timer) clearInterval(wsData.heartbeat.timer);
		},
		// drain no longer resets alive (drain bug fix)
	} as unknown as WSHandler<DI>;
}

/** Internal helper for buntok.ts - reset pong */
export function wsHeartbeatPong<DI>(ws: ServerWebSocket<WSData<DI>>): void {
	const wsData = ws.data as unknown as WSDataWithHeartbeat<DI>;
	if (wsData.heartbeat) wsData.heartbeat.alive = true;
}

/**
 * WebSocket rate limiter - in-memory default, pluggable to Redis
 * @example
 * const limiter = wsRateLimit({ windowMs: 1000, max: 10 })
 * app.ws("/chat", { ...limiter, message: (ws,msg)=>{} })
 */
export interface WSRateLimitOptions<DI = Record<string, unknown>> {
	windowMs?: number;
	max?: number;
	store?: WSRateLimitStore;
	keyGenerator?: (ws: ServerWebSocket<WSData<DI>>) => string;
	/** Close code when the limit is hit */
	closeCode?: number;
}
export function wsRateLimit<DI = Record<string, unknown>>(opts: WSRateLimitOptions<DI> = {}): WSHandler<DI> {
	const windowMs = opts.windowMs ?? 1000;
	const max = opts.max ?? 20;
	const store = opts.store ?? new MemoryWSRateLimitStore();
	const keyGen = opts.keyGenerator ?? ((ws: ServerWebSocket<WSData<DI>>) => (ws.data.ctx.ip || "unknown"));
	const closeCode = opts.closeCode ?? 1013;
	return {
		message: (ws: ServerWebSocket<WSData<DI>>) => {
			const key = keyGen(ws);
			const count = store.incr(key, windowMs);
			const c = count instanceof Promise ? 0 : count;
			// async case handled via promise
			if (count instanceof Promise) {
				count.then((n) => { if (n > max) try { ws.close(closeCode, "Rate limited"); } catch {} });
				return;
			}
			if (c > max) {
				try { ws.close(closeCode, "Rate limited"); } catch {}
			}
		},
	} as WSHandler<DI>;
}

/**
 * WebSocket authentication middleware - pluggable
 */
export function wsAuth<DI extends Record<string, unknown>, TAuth = unknown>(
	authenticate: (ws: ServerWebSocket<WSData<DI>>) => Promise<TAuth | null>,
): WSHandler<DI> {
	return {
		open: async (ws) => {
			try {
				const authData = await authenticate(ws);
				if (authData === null) {
					ws.close(4001, "Unauthorized");
					return;
				}
				(ws.data as unknown as Record<string, unknown>).auth = authData;
			} catch {
				ws.close(4001, "Unauthorized");
			}
		},
	} as WSHandler<DI>;
}
