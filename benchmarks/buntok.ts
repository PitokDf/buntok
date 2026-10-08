import { Buntok, file } from "../packages/buntok-core/src/index.ts";
import { extraRoutes } from "./extra-routes.mjs";

const VIDEO = "benchmarks/public/kyuukurarin.mp4";

const app = new Buntok();
app.disable("x-powered-by");
app.disable("logger");

for (const route of extraRoutes) {
	app.get(route, "ok");
	app.post(`${route}/submit`, "ok");
}

app
	.get("/", "Hi")
	.get("/video", () => file(VIDEO))
	.get("/id/:id", (ctx) => {
		ctx.set.headers["x-powered-by"] = "benchmark";
		return ctx.text(`${ctx.params.id} ${ctx.query.name ?? ""}`);
	})
	.post("/json", async (ctx) => ctx.json(await ctx.body()));

app.listen(3000, () => {
	console.log("Buntok running on 3000");
});
