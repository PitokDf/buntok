import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
	Scheduler,
	MemorySchedulerDriver,
	setDefaultSchedulerDriver,
} from "../src/schedule";

describe("MemorySchedulerDriver", () => {
	let driver: MemorySchedulerDriver;

	beforeEach(() => {
		driver = new MemorySchedulerDriver();
	});

	afterEach(() => {
		driver.stopAll();
	});

	it("should schedule a job and return a cron instance", () => {
		const job = driver.schedule("* * * * * *", () => {});
		expect(job).toBeDefined();
	});

	it("should stop all jobs without error", () => {
		driver.schedule("* * * * * *", () => {});
		driver.schedule("* * * * * *", () => {});
		expect(() => driver.stopAll()).not.toThrow();
	});

	it("should accept cron patterns", () => {
		expect(() => driver.schedule("0 0 * * *", () => {})).not.toThrow();
		expect(() => driver.schedule("*/5 * * * *", () => {})).not.toThrow();
		expect(() => driver.schedule("0 0 1 * *", () => {})).not.toThrow();
	});

	it("should accept options parameter", () => {
		expect(() =>
			driver.schedule("* * * * * *", () => {}, { timezone: "Asia/Jakarta" }),
		).not.toThrow();
	});
});

describe("Scheduler", () => {
	let scheduler: Scheduler;

	beforeEach(() => {
		scheduler = new Scheduler(new MemorySchedulerDriver());
	});

	afterEach(() => {
		scheduler.stopAll();
	});

	it("should schedule a job via driver", () => {
		let called = false;
		scheduler.schedule("* * * * * *", () => {
			called = true;
		});
		expect(called).toBe(false);
	});

	it("should stop all jobs", () => {
		scheduler.schedule("* * * * * *", () => {});
		expect(() => scheduler.stopAll()).not.toThrow();
	});

	it("should use default driver when none provided", () => {
		const defaultScheduler = new Scheduler();
		expect(() => defaultScheduler.schedule("* * * * * *", () => {})).not.toThrow();
	});
});

describe("setDefaultSchedulerDriver", () => {
	afterEach(() => {
		setDefaultSchedulerDriver(new MemorySchedulerDriver());
	});

	it("should set the global default driver", () => {
		const driver = new MemorySchedulerDriver();
		setDefaultSchedulerDriver(driver);
		expect(() => {
			const s = new Scheduler();
			s.schedule("* * * * * *", () => {});
		}).not.toThrow();
	});
});
