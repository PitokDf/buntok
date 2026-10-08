import { Elysia } from "elysia";
import { extraRoutes } from "./extra-routes.mjs";

const VIDEO = "benchmarks/public/kyuukurarin.mp4";

const app = new Elysia();
const shared = () => "ok";
for (const route of extraRoutes) {
	app.get(route, "ok").post(`${route}/submit`, shared);
}

app
	.get("/", "Hi")
	.get(
		"/video",
		() =>
			new Response(Bun.file(VIDEO), {
				headers: { "content-type": "video/mp4" },
			}),
	)
	.get("/id/:id", (c) => {
		c.set.headers["x-powered-by"] = "benchmark";
		return `${c.params.id} ${c.query.name ?? ""}`;
	})
	.post("/json", (c) => c.body);

app.listen(3000, () => {
	console.log("Elysia running on 3000");
});
