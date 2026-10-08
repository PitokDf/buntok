import fastify from "fastify";
import { createReadStream } from "node:fs";
import { extraRoutes } from "./extra-routes.mjs";

const VIDEO = "benchmarks/public/kyuukurarin.mp4";

const server = fastify();
for (const route of extraRoutes) {
	server.get(route, () => "ok").post(`${route}/submit`, () => "ok");
}

server
	.get("/", () => "Hi")
	.get("/video", (_req, reply) => {
		reply.header("content-type", "video/mp4");
		return createReadStream(VIDEO);
	})
	.get("/id/:id", (req, reply) => {
		reply.header("x-powered-by", "benchmark");
		const name = typeof (req.query as any).name === "string" ? (req.query as any).name : "";
		return `${(req.params as any).id} ${name}`;
	})
	.post("/json", (req) => req.body);

server.listen({ port: 3000 }, (err) => {
	if (err) {
		server.log.error(err);
		process.exit(1);
	}
	console.log("Fastify running on 3000");
});
