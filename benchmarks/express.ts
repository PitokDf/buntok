import express from "express";
import { createReadStream, statSync } from "node:fs";
import { extraRoutes } from "./extra-routes.mjs";

const VIDEO = "benchmarks/public/kyuukurarin.mp4";
const VIDEO_SIZE = statSync(VIDEO).size;

const app = express();
app.set("x-powered-by", false);
app.set("etag", false);

for (const route of extraRoutes) {
	app.get(route, (_req, res) => {
		res.setHeader("content-type", "text/plain").send("ok");
	});
	app.post(`${route}/submit`, (_req, res) => {
		res.setHeader("content-type", "text/plain").send("ok");
	});
}

app
	.get("/", (_req, res) => {
		res.setHeader("content-type", "text/plain").send("Hi");
	})
	.get("/video", (_req, res) => {
		res.setHeader("content-type", "video/mp4");
		res.setHeader("content-length", String(VIDEO_SIZE));
		createReadStream(VIDEO).pipe(res);
	})
	.post("/json", express.json(), ({ body }, res) => {
		res.json(body);
	})
	.get("/id/:id", ({ params: { id }, query }, res) => {
		const name = typeof query.name === "string" ? query.name : "";
		res.setHeader("x-powered-by", "benchmark")
			.setHeader("content-type", "text/plain")
			.send(`${id} ${name}`);
	})
	.listen(3000, () => {
		console.log("Express running on 3000");
	});
