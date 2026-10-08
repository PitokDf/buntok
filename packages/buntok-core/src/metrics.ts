import type { Middleware } from "./buntok";

export interface MetricSnapshot {
	requests: number;
	errors: number;
	inFlight: number;
	totalDurationMs: number;
	byRoute: Record<string, number>;
	byStatusClass: Record<string, number>;
}

export class Metrics {
	private snapshot: MetricSnapshot = {
		requests: 0,
		errors: 0,
		inFlight: 0,
		totalDurationMs: 0,
		byRoute: {},
		byStatusClass: {},
	};

	record(route: string, status: number, durationMs: number): void {
		this.snapshot.requests++;
		this.snapshot.inFlight = Math.max(0, this.snapshot.inFlight - 1);
		this.snapshot.totalDurationMs += durationMs;
		this.snapshot.byRoute[route] = (this.snapshot.byRoute[route] ?? 0) + 1;
		const statusClass = `${Math.floor(status / 100)}xx`;
		this.snapshot.byStatusClass[statusClass] = (this.snapshot.byStatusClass[statusClass] ?? 0) + 1;
		if (status >= 500) this.snapshot.errors++;
	}

	start(): void {
		this.snapshot.inFlight++;
	}

	read(): MetricSnapshot {
		return structuredClone(this.snapshot);
	}

	toPrometheus(): string {
		const snapshot = this.snapshot;
		const lines = [
			"# TYPE buntok_http_requests_total counter",
			`buntok_http_requests_total ${snapshot.requests}`,
			"# TYPE buntok_http_errors_total counter",
			`buntok_http_errors_total ${snapshot.errors}`,
			"# TYPE buntok_http_in_flight gauge",
			`buntok_http_in_flight ${snapshot.inFlight}`,
			"# TYPE buntok_http_duration_ms_total counter",
			`buntok_http_duration_ms_total ${snapshot.totalDurationMs}`,
		];
		return `${lines.join("\n")}\n`;
	}
}

export function metricsMiddleware(metrics: Metrics, route = "unknown"): Middleware {
	return async (_ctx, next) => {
		metrics.start();
		const started = performance.now();
		try {
			const response = await next();
			metrics.record(route, response instanceof Response ? response.status : 200, performance.now() - started);
			return response;
		} catch (error) {
			metrics.record(route, 500, performance.now() - started);
			throw error;
		}
	};
}

export function metricsEndpoint(metrics: Metrics, path = "/metrics") {
	return (appOrNothing?: { get: (path: string, handler: () => Response) => unknown }) => {
		const register = (target: { get: (path: string, handler: () => Response) => unknown }) => {
			target.get(path, () => new Response(metrics.toPrometheus(), {
				headers: { "Content-Type": "text/plain; version=0.0.4" },
			}));
		};

		if (appOrNothing) {
			register(appOrNothing);
			return;
		}

		// Return a plugin function if no app provided
		return (app: { get: (path: string, handler: () => Response) => unknown }) => {
			register(app);
		};
	};
}