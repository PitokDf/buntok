import type { Duration } from "./_lib/types";

export function formatISODuration(duration: Duration): string {
	const {
		years = 0,
		months = 0,
		days = 0,
		hours = 0,
		minutes = 0,
		seconds = 0,
	} = duration;

	return `P${years}Y${months}M${days}DT${hours}H${minutes}M${seconds}S`;
}
