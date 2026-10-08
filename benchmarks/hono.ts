import { Hono } from "hono";
import { extraRoutes } from "./extra-routes.mjs";

const VIDEO = "benchmarks/public/kyuukurarin.mp4";

const app = new Hono();
for (const route of extraRoutes) {
	app.get(route, (c) => c.text("ok")).post(`${route}/submit`, (c) =>
		c.text("ok"),
	);
}

app
	.get("/", (c) => c.text("Hi"))
	.get(
		"/video",
		() =>
			new Response(Bun.file(VIDEO), {
				headers: { "content-type": "video/mp4" },
			}),
	)
	.post("/json", (c) => c.req.json().then((body) => c.json(body)))
	.get("/id/:id", (c) => {
		const id = c.req.param("id");
		const name = c.req.query("name") ?? "";

		c.header("x-powered-by", "benchmark");

		return c.text(`${id} ${name}`);
	});

export default {
	port: 3000,
	fetch: app.fetch,
};
