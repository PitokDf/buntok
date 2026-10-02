export function isExists(year: number, month: number, day: number): boolean {
	const date = new Date(year, month, day);
	return (
		date.getFullYear() === year &&
		date.getMonth() === month &&
		date.getDate() === day
	);
}
