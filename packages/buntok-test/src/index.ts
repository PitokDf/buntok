import "./env";
import { Buntok } from "@buntok/core";
import { Metrics, metricsEndpoint, metricsMiddleware } from "@buntok/core/metrics";
import { getQuarter, addDays, getYear, getTime } from "@buntok/core/date";
import { differenceInCalendarDays } from "@buntok/core/date";
import { DateController } from "./controllers/date.controller";
import { TestController } from "./controllers/test.controller";
import { MailerController } from "./controllers/mailer.controller";
import { PaymentController } from "./controllers/payment.controller";
import { SchemaDemoController } from "./controllers/schema-demo.controller";

export const app = new Buntok({ handleSignals: true });

const metric = new Metrics()
app.use(metricsMiddleware(metric));
metricsEndpoint(metric)(app);

app.get("/", () => {
	const today = new Date();
	const quarter = getQuarter(today);
	const year = getYear(today);
	const time = getTime(today);
	const newDate = addDays(today, 10);
	const diff = differenceInCalendarDays(newDate, today);

	return {
		message: "Hello World",
		quarter,
		year,
		time,
		newDate,
		diff
	}
})
app.cors({
	origin: ["http://localhost:3000", "http://localhost:3001"],
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	credentials: true,
});

app.apiDocs({
	title: "API Documentation",
	version: "1.0.1",
	description: "api docs for buntok test",
});

app.responseProfile({
	success(data, message, status, ctx) {
		return {
			path: ctx.pathname,
			success: true,
			data,
			message: message || "Success",
			status: status || 200,
		}
	},

})
// const container = new Container();
// container.scan([TestController, SchemaDemoController]);
// app.setContainer(container);

app.registerController([TestController,
	MailerController,
	PaymentController,
	SchemaDemoController]);

app.registerController(DateController);
