import "./env";
import { TestController } from "./controllers/test.controller";
import { Container, App } from "@buntok/core";
import { MailerController } from "./controllers/mailer.controller";
import { PaymentController } from "./controllers/payment.controller";
import { SchemaDemoController } from "./controllers/schema-demo.controller";
import { Metrics, metricsEndpoint, metricsMiddleware } from "@buntok/core/metrics";

export const app = new App({ handleSignals: true });

app.registerResource({
	name: "test", close() {
		console.log("Closing test resource...");
	},
})

const metric = new Metrics()
app.use(metricsMiddleware(metric));
metricsEndpoint(metric)(app);

app.cors({
	origin: "*",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	credentials: true,
});

app.apiDocs({
	title: "API Documentation",
	version: "1.0.1",
	description: "api docs for buntok test",
});

const container = new Container();
container.scan([TestController, SchemaDemoController]);
app.setContainer(container);

app.registerController([
	TestController,
	MailerController,
	PaymentController,
	SchemaDemoController,
]);
