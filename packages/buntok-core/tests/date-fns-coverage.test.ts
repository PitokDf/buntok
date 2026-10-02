import { describe, expect, it } from "bun:test";
import * as theirs from "date-fns";
import * as theirsFp from "date-fns/fp";
import * as theirsLocale from "date-fns/locale";
import * as ours from "../src/date";
import * as oursFp from "../src/date-fp";
import * as oursLocale from "../src/helpers/date-fns/locale/index";
import {
	REMAINING_FP,
	REMAINING_LOCALE,
	REMAINING_MAIN,
} from "./helpers/date-fns-remaining";

describe("date-fns coverage: main exports (@buntok/core/date)", () => {
	it("does not export names missing from date-fns", () => {
		const theirsKeys = new Set(Object.keys(theirs));
		const extras = Object.keys(ours).filter((k) => !theirsKeys.has(k)).sort();
		expect(extras).toEqual([]);
	});

	it("missing exports match the committed remaining list (250 total)", () => {
		const missing = Object.keys(theirs).filter((k) => !(k in ours)).sort();
		expect(missing).toEqual([...REMAINING_MAIN].sort());
	});
});

describe("date-fns coverage: locale exports", () => {
	it("does not export names missing from date-fns/locale", () => {
		const theirsKeys = new Set(Object.keys(theirsLocale));
		const extras = Object.keys(oursLocale)
			.filter((k) => !theirsKeys.has(k))
			.sort();
		expect(extras).toEqual([]);
	});

	it("missing exports match the committed remaining list (95 total)", () => {
		const missing = Object.keys(theirsLocale)
			.filter((k) => !(k in oursLocale))
			.sort();
		expect(missing).toEqual([...REMAINING_LOCALE].sort());
	});
});

describe("date-fns coverage: fp exports (@buntok/core/date/fp)", () => {
	it("does not export names missing from date-fns/fp", () => {
		const theirsKeys = new Set(Object.keys(theirsFp));
		const extras = Object.keys(oursFp).filter((k) => !theirsKeys.has(k)).sort();
		expect(extras).toEqual([]);
	});

	it("missing exports match the committed remaining list (396 total)", () => {
		const missing = Object.keys(theirsFp)
			.filter((k) => !(k in oursFp))
			.sort();
		expect(missing).toEqual([...REMAINING_FP].sort());
	});
});
