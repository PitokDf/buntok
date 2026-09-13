// ─── Standalone Helpers ────────────────────────────────────────────────────────
// These helpers have zero internal dependencies (except async-handler → response).
// Import via: import { ... } from "@buntok/core/helpers"

// Async helpers
export type { RetryOptions } from "./helpers/async";
export { delay, retry } from "./helpers/async";

// Response helpers
export { toResponse, toResponseMaybeAsync } from "./helpers/response";

// Error helpers
export {
	asyncHandler,
	BadRequestError,
	ConflictError,
	ForbiddenError,
	HttpError,
	InternalServerError,
	MethodNotAllowedError,
	NotFoundError,
	ServiceUnavailableError,
	TooManyRequestsError,
	UnauthorizedError,
	UnprocessableEntityError,
} from "./helpers/async-handler";

// Cookie helpers
export type { CookieOptions } from "./helpers/cookie";
export {
	deleteCookie,
	getCookie,
	getCookies,
	parseCookies,
	serializeCookie,
	setCookie,
} from "./helpers/cookie";

// Crypto helpers
export {
	decrypt,
	encrypt,
	fastHash,
	hash,
	hashVerify,
	hmac,
	md5,
	randomAlphaNumeric,
	randomBytes,
	randomHex,
	randomToken,
	sha256,
	sha512,
} from "./helpers/crypto";

// Date helpers
export {
	addDays,
	daysBetween,
	endOfDay,
	formatDate,
	formatDuration,
	isAfter,
	isBefore,
	startOfDay,
	timeAgo,
} from "./helpers/date";

// Timezone helpers
export {
	formatGroupLabel,
	formatInTimezone,
	getGroupLabels,
	getTimezoneOffset,
	getTimezoneOffsetString,
	groupByTimezone,
	isValidTimezone,
	nowInTimezone,
	parseTime,
	toISOWithTimezone,
	toTimezoneParts,
} from "./helpers/timezone";
export type { GroupByKey, GroupByTimezoneOptions } from "./helpers/timezone";

// ID helpers
export {
	generateCode,
	nanoid,
	resetCounter,
	ulid,
} from "./helpers/id";

// Network helpers
export { getClientIP, isPrivateIP, parseUserAgent, type TrustedProxyOptions } from "./helpers/network";

// Number helpers
export {
	clamp,
	formatBytes,
	formatCurrency,
	formatNumber,
	random,
	randomFloat,
} from "./helpers/number";

// Object helpers
export {
	chunk,
	deepMerge,
	flatten,
	flattenObject,
	groupBy,
	omit,
	pick,
	uniq,
} from "./helpers/object";

// Password helpers
export { hashPassword, verifyPassword } from "./helpers/password";

// Avatar helpers
export {
	generateInitials,
	avatarColor,
	generateInitialAvatar,
	type InitialAvatarOptions,
} from "./helpers/avatar";

// File helpers
export {
	serveFileOrFallback,
	type ServeFileOptions,
} from "./helpers/file";

// Download helpers
export {
	downloadFile,
	downloadBuffer,
	type DownloadOptions,
} from "./helpers/download";

// Export helpers
export {
	exportCSV,
	exportJSON,
	type CSVOptions,
} from "./helpers/export";

// Archive helpers
export {
	createZIP,
	type ZIPEntry,
	type ArchiveOptions,
} from "./helpers/archive";

// String helpers
export {
	camelCase,
	capitalize,
	kebabCase,
	slugify,
	snakeCase,
	truncate,
} from "./helpers/string";
