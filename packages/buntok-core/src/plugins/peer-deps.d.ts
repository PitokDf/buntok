// Type declarations for optional peer dependencies
// These are lazy-imported at runtime - types only needed at compile time

declare module "@apollo/server" {
	export class ApolloServer {
		constructor(config: any);
		executeHTTPGraphQLRequest(request: any): Promise<any>;
	}
}

declare module "@apollo/server/standalone" {
	export function startServer(
		server: any,
		options?: any,
	): Promise<{ url: string }>;
}

declare module "graphql-yoga" {
	export function createYoga(config: any): {
		fetch(request: Request): Promise<Response>;
	};
	export function createSchema(config: any): any;
}

declare module "@opentelemetry/api" {
	export const trace: {
		getTracer(name: string, version?: string): any;
		setSpan(context: any, span: any): any;
	};
	export const context: {
		active(): any;
		with(context: any, fn: () => any): any;
	};
	export const SpanKind: {
		SERVER: number;
	};
	export const SpanStatusCode: {
		OK: number;
		ERROR: number;
	};
}

declare module "@opentelemetry/sdk-node" {
	export class NodeSDK {
		constructor(config: any);
		start(): void;
		shutdown(): Promise<void>;
	}
}

declare module "@opentelemetry/resources" {
	export function resourceFromAttributes(attributes: Record<string, string>): any;
}

declare module "@opentelemetry/semantic-conventions" {
	export const ATTR_SERVICE_NAME: string;
	export const ATTR_SERVICE_VERSION: string;
}

declare module "@opentelemetry/sdk-trace-node" {
	export class ConsoleSpanExporter {
		export(spans: any[]): Promise<void>;
	}
}

declare module "@opentelemetry/exporter-trace-otlp-http" {
	export class OTLPTraceExporter {
		constructor(config?: { url?: string });
		export(spans: any[]): Promise<void>;
	}
}

declare module "nodemailer" {
	export function createTransport(config: any): any;
}
