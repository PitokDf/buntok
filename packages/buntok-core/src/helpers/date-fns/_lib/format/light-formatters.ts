import { addLeadingZeros } from "../add-leading-zeros";

export const lightFormatters = {
	y(date: Date, token: string): string {
		const signedYear = date.getFullYear();
		const year = signedYear > 0 ? signedYear : 1 - signedYear;
		return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
	},

	M(date: Date, token: string): string {
		const month = date.getMonth();
		return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
	},

	d(date: Date, token: string): string {
		return addLeadingZeros(date.getDate(), token.length);
	},

	a(date: Date, token: string): string {
		const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";

		switch (token) {
			case "a":
			case "aa":
				return dayPeriodEnumValue.toUpperCase();
			case "aaa":
				return dayPeriodEnumValue;
			case "aaaaa":
				return dayPeriodEnumValue[0]!;
			case "aaaa":
			default:
				return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
		}
	},

	h(date: Date, token: string): string {
		return addLeadingZeros(date.getHours() % 12 || 12, token.length);
	},

	H(date: Date, token: string): string {
		return addLeadingZeros(date.getHours(), token.length);
	},

	m(date: Date, token: string): string {
		return addLeadingZeros(date.getMinutes(), token.length);
	},

	s(date: Date, token: string): string {
		return addLeadingZeros(date.getSeconds(), token.length);
	},

	S(date: Date, token: string): string {
		const numberOfDigits = token.length;
		const milliseconds = date.getMilliseconds();
		const fractionalSeconds = Math.trunc(
			milliseconds * Math.pow(10, numberOfDigits - 3),
		);
		return addLeadingZeros(fractionalSeconds, token.length);
	},
};
