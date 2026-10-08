import { mkdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { Middleware } from "./buntok";
import type { Context } from "./context";
import { BadRequestError } from "./helpers/async-handler";

export interface UploadedFile {
	/** Original name of the file */
	originalName: string;
	/** Generated filename without extension (e.g., "avatar-123") */
	name: string;
	/** File extension with dot (e.g., ".png") */
	ext: string;
	/** Size of the file in bytes */
	size: number;
	/** MIME type of the file */
	type: string;
	/** For MemoryStorage: the actual file data as ArrayBuffer */
	buffer?: ArrayBuffer;
	/** For LocalDiskStorage: the absolute path where it was saved */
	path?: string;
}

/**
 * Extended UploadedFile for image files processed with Bun.Image.
 * Only available when `outputFormat` is set in UploadFieldConfig.
 */
export interface ImageUploadedFile extends UploadedFile {
	/** Discriminant for runtime type narrowing */
	kind: "image";
	/** Image width in pixels */
	width: number;
	/** Image height in pixels */
	height: number;
	/** Detected image format (e.g., "png", "jpeg", "webp") */
	format: string;
	/** MIME type before conversion (only set when outputFormat differs from input) */
	originalType?: string;
	/** File extension before conversion (only set when outputFormat differs from input) */
	originalExt?: string;
}

/** Image MIME types that Bun.Image can process */
const IMAGE_MIME_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
	"image/bmp",
	"image/tiff",
]);

/** Output format → { ext, type } mapping */
const OUTPUT_FORMAT_MAP: Record<string, { ext: string; type: string }> = {
	webp: { ext: ".webp", type: "image/webp" },
	png: { ext: ".png", type: "image/png" },
	jpeg: { ext: ".jpg", type: "image/jpeg" },
	avif: { ext: ".avif", type: "image/avif" },
};

function isImageMime(type: string): boolean {
	return IMAGE_MIME_TYPES.has(type);
}

async function getImageMetadata(
	file: File,
): Promise<{ width: number; height: number; format: string } | null> {
	if (!isImageMime(file.type)) return null;
	try {
		const image = new Bun.Image(file);
		const metadata = await image.metadata();
		return {
			width: metadata.width,
			height: metadata.height,
			format: metadata.format,
		};
	} catch {
		return null;
	}
}

async function convertImage(
	file: File,
	outputFormat: keyof typeof OUTPUT_FORMAT_MAP,
): Promise<File> {
	const image = new Bun.Image(file);
	// Bun.Image methods (.png(), .jpeg(), etc.) return Promise<Buffer> at runtime,
	// but @types/bun types them as returning Image. Cast to fix.
	let buffer: Buffer;

	switch (outputFormat) {
		case "png":
			buffer = (await image.png().toBuffer()) as Buffer;
			break;
		case "jpeg":
			buffer = (await image.jpeg().toBuffer()) as Buffer;
			break;
		case "webp":
			buffer = (await image.webp().toBuffer()) as Buffer;
			break;
		case "avif":
			buffer = (await image.avif().toBuffer()) as Buffer;
			break;
		default:
			buffer = (await image.png().toBuffer()) as Buffer;
	}

	const info = OUTPUT_FORMAT_MAP[outputFormat]!;
	return new File([buffer], file.name.replace(/\.[^.]+$/, info.ext), {
		type: info.type,
	});
}

export interface StorageDriver {
	/** Handle a single file from the FormData stream */
	handleFile(
		file: File,
		name: string,
		ext: string,
	): Promise<UploadedFile> | UploadedFile;
	/** Delete a file by its path or filename. Returns true if deleted. */
	deleteFile?(path: string): Promise<boolean>;
}

// Single source of truth - all supported MIME types and their magic bytes signatures.
// The MimeType type is inferred from the keys.
const MAGIC_BYTES = {
	// Images
	"image/jpeg": [[0xff, 0xd8, 0xff]],
	"image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
	"image/gif": [[0x47, 0x49, 0x46, 0x38]], // GIF8
	"image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF
	"image/svg+xml": [], // XML-based, no reliable magic bytes
	"image/bmp": [[0x42, 0x4d]], // BM
	"image/tiff": [
		[0x49, 0x49, 0x2a, 0x00], // Little-endian
		[0x4d, 0x4d, 0x00, 0x2a], // Big-endian
	],
	"image/x-icon": [
		[0x00, 0x00, 0x01, 0x00], // ICO
		[0x00, 0x00, 0x02, 0x00], // CUR
	],
	"image/avif": [[0x00, 0x00, 0x00]], // ftyp avif/mif1
	"image/heic": [[0x00, 0x00, 0x00]], // ftyp heic/mif1
	"image/heif": [[0x00, 0x00, 0x00]], // ftyp heif/mif1

	// Videos
	"video/mp4": [[0x00, 0x00, 0x00]], // ftyp
	"video/webm": [[0x1a, 0x45, 0xdf, 0xa3]], // EBML
	"video/ogg": [[0x4f, 0x67, 0x67, 0x53]], // OggS
	"video/quicktime": [[0x00, 0x00, 0x00]], // ftyp qt
	"video/x-msvideo": [[0x52, 0x49, 0x46, 0x46]], // RIFF
	"video/x-matroska": [[0x1a, 0x45, 0xdf, 0xa3]], // EBML
	"video/mpeg": [
		[0x00, 0x00, 0x01, 0xba],
		[0x00, 0x00, 0x01, 0xb3],
	],

	// Audio
	"audio/mpeg": [
		[0xff, 0xfb],
		[0xff, 0xf3],
		[0xff, 0xf2],
	],
	"audio/mp3": [
		[0xff, 0xfb],
		[0xff, 0xf3],
		[0xff, 0xf2],
	],
	"audio/wav": [[0x52, 0x49, 0x46, 0x46]], // RIFF
	"audio/ogg": [[0x4f, 0x67, 0x67, 0x53]], // OggS
	"audio/webm": [[0x1a, 0x45, 0xdf, 0xa3]], // EBML
	"audio/aac": [
		[0xff, 0xf1],
		[0xff, 0xf9],
	], // ADTS
	"audio/flac": [[0x66, 0x4c, 0x61, 0x43]], // fLaC
	"audio/mp4": [[0x00, 0x00, 0x00]], // ftyp
	"audio/x-m4a": [[0x00, 0x00, 0x00]], // ftyp M4A

	// Documents
	"application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
	"application/rtf": [[0x7b, 0x5c, 0x72, 0x74, 0x66]], // {\rtf
	"text/plain": [],
	"text/csv": [],
	"text/html": [],
	"text/css": [],
	"text/javascript": [],
	"application/javascript": [],
	"application/json": [],
	"application/xml": [],
	"text/xml": [],

	// Microsoft Office (OLE2)
	"application/msword": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
	"application/vnd.ms-excel": [
		[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
	],
	"application/vnd.ms-powerpoint": [
		[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
	],

	// Microsoft Office (OOXML - ZIP based)
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
		[0x50, 0x4b, 0x03, 0x04],
	],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
		[0x50, 0x4b, 0x03, 0x04],
	],
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": [
		[0x50, 0x4b, 0x03, 0x04],
	],

	// OpenDocument (ZIP based)
	"application/vnd.oasis.opendocument.text": [[0x50, 0x4b, 0x03, 0x04]],
	"application/vnd.oasis.opendocument.spreadsheet": [[0x50, 0x4b, 0x03, 0x04]],
	"application/vnd.oasis.opendocument.presentation": [[0x50, 0x4b, 0x03, 0x04]],

	// Archives
	"application/zip": [[0x50, 0x4b, 0x03, 0x04]],
	"application/x-7z-compressed": [[0x37, 0x7a, 0xaf, 0x1d]],
	"application/x-rar-compressed": [[0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]],
	"application/gzip": [[0x1f, 0x8b]],
	"application/x-tar": [], // Check at offset 257: "ustar"
	"application/x-bzip2": [[0x42, 0x5a, 0x68]], // BZh

	// Fonts
	"font/woff": [[0x77, 0x4f, 0x46, 0x46]], // wOFF
	"font/woff2": [[0x77, 0x4f, 0x46, 0x32]], // wOF2
	"font/ttf": [
		[0x00, 0x01, 0x00, 0x00], // TrueType
		[0x4f, 0x54, 0x54, 0x4f], // OTTO (OpenType)
	],
	"font/otf": [[0x4f, 0x54, 0x54, 0x4f]], // OTTO

	// Other
	"application/octet-stream": [],
} as const;

/** Supported MIME types - inferred from the MAGIC_BYTES keys. */
export type MimeType = keyof typeof MAGIC_BYTES;

export interface UploadFieldConfig {
	/** Whether this file field is required. Defaults to false. */
	required?: boolean;
	/** Whether this field accepts multiple files. Defaults to false. */
	multiple?: boolean;
	/** Max file size in bytes for this field */
	maxFileSize?: number;
	/** Allowed MIME types for this field */
	allowedMimeTypes?: MimeType[];
	/** Custom filename generator for this field (overrides global filename) */
	filename?: (
		originalName: string,
		file: File,
	) => { name: string; ext: string };
	/**
	 * Force image conversion to this format on upload.
	 * When set, the returned file type narrows to `ImageUploadedFile`
	 * with `width`, `height`, `format`, and optional `originalType`/`originalExt`.
	 *
	 * Only applies to image MIME types (image/jpeg, image/png, image/gif, etc.).
	 * Non-image files ignore this option.
	 */
	outputFormat?: "webp" | "png" | "jpeg" | "avif";
}

export interface UploadOptions {
	/** Destination storage driver (e.g., LocalDiskStorage or MemoryStorage) */
	storage: StorageDriver;
	/** Global default filename generator (overridden by per-field filename) */
	filename?: (
		originalName: string,
		file: File,
	) => { name: string; ext: string };
	/**
	 * Global max file size in bytes.
	 * Applied to all fields unless overridden by per-field `maxFileSize`.
	 */
	maxFileSize?: number;
	/**
	 * Global allowed MIME types.
	 * Applied to all fields unless overridden by per-field `allowedMimeTypes`.
	 */
	allowedMimeTypes?: MimeType[];
	/**
	 * Whitelist of accepted file field names.
	 * Files with a field name not listed here will be silently ignored.
	 * Each field has its own maxFileSize, allowedMimeTypes, and filename config
	 * that override the global defaults when set.
	 *
	 * @example
	 * fields: {
	 *   avatar: { required: true, maxFileSize: 2 * 1024 * 1024, allowedMimeTypes: ['image/png'] },
	 *   document: { required: true, maxFileSize: 10 * 1024 * 1024 },
	 * }
	 */
	fields?: Record<string, UploadFieldConfig>;
	/** Verify file magic bytes against expected MIME type. Defaults to true. */
	verifyMagicBytes?: boolean;
}

export type UploadOptionsWithFields<
	F extends Record<string, UploadFieldConfig>,
> = Omit<UploadOptions, "fields"> & { fields?: F };

export interface ParseUploadResult<
	F extends Record<string, UploadFieldConfig> = Record<
		string,
		UploadFieldConfig
	>,
> {
	/**
	 * All form fields - text fields are `string`, file fields are typed based on config.
	 *
	 * When `outputFormat` is set, the field narrows to `ImageUploadedFile`
	 * with `width`, `height`, `format`, and optional `originalType`/`originalExt`.
	 *
	 * When `multiple: true`, the field returns an array `T[]`.
	 * When `required: true`, the field is non-nullable.
	 *
	 * @example
	 * result.fields.name      // string (text field)
	 * result.fields.avatar    // ImageUploadedFile (outputFormat: "webp")
	 * result.fields.document  // UploadedFile (no outputFormat)
	 * result.fields.photos    // UploadedFile[] (multiple: true)
	 */
	fields: {
		[K in keyof F]: F[K] extends { outputFormat: any }
			? F[K] extends { multiple: true }
				? F[K] extends { required: true }
					? ImageUploadedFile[]
					: ImageUploadedFile[] | undefined
				: F[K] extends { required: true }
					? ImageUploadedFile
					: ImageUploadedFile | undefined
			: F[K] extends { multiple: true }
				? F[K] extends { required: true }
					? UploadedFile[]
					: UploadedFile[] | undefined
				: F[K] extends { required: true }
					? UploadedFile
					: F[K] extends { maxFileSize: any } | { allowedMimeTypes: any }
						? UploadedFile | undefined
						: UploadedFile | UploadedFile[] | undefined;
	} & Record<string, string>;
	/** Array of files that were successfully uploaded/processed (all files, flattened) */
	files: (UploadedFile | ImageUploadedFile)[];
}

export class LocalDiskStorage implements StorageDriver {
	constructor(private destination: string) {}

	async handleFile(
		file: File,
		name: string,
		ext: string,
	): Promise<UploadedFile> {
		// Ensure directory exists
		try {
			await stat(this.destination);
		} catch {
			await mkdir(this.destination, { recursive: true });
		}

		const filename = `${name}${ext}`;
		const filePath = join(this.destination, filename);
		await Bun.write(filePath, file);

		return {
			originalName: file.name,
			name,
			ext,
			size: file.size,
			type: file.type,
			path: filePath,
		};
	}

	async deleteFile(filePath: string): Promise<boolean> {
		try {
			await unlink(filePath);
			return true;
		} catch {
			return false;
		}
	}
}

export class MemoryStorage implements StorageDriver {
	async handleFile(
		file: File,
		name: string,
		ext: string,
	): Promise<UploadedFile> {
		const buffer = await file.arrayBuffer();
		return {
			originalName: file.name,
			name,
			ext,
			size: file.size,
			type: file.type,
			buffer,
		};
	}

	async deleteFile(_filePath: string): Promise<boolean> {
		// MemoryStorage holds files in memory - nothing to delete on disk.
		return true;
	}
}

function getFileExtension(originalName: string): string {
	const extIndex = originalName.lastIndexOf(".");
	if (extIndex !== -1) {
		return originalName.substring(extIndex);
	}
	return "";
}

const defaultFilenameGenerator = (originalName: string) => {
	const ext = getFileExtension(originalName);
	const name = ext
		? originalName.substring(0, originalName.length - ext.length)
		: originalName;
	return { name: `${name}-${crypto.randomUUID()}`, ext };
};

function resolveFilename(
	originalName: string,
	file: File,
	fieldFn?: (originalName: string, file: File) => { name: string; ext: string },
	globalFn?: (
		originalName: string,
		file: File,
	) => { name: string; ext: string },
): { name: string; ext: string } {
	const ext = getFileExtension(originalName);
	const generateFn = fieldFn ?? globalFn ?? defaultFilenameGenerator;
	const result = generateFn(originalName, file);

	// Ensure ext always has the dot prefix
	const finalExt = result.ext.startsWith(".") ? result.ext : ext;

	return { name: result.name, ext: finalExt };
}

async function verifyFileSignature(
	file: File,
	expectedType: string,
): Promise<boolean> {
	const signatures = MAGIC_BYTES[expectedType as keyof typeof MAGIC_BYTES];

	// No magic bytes defined for this type → skip verification
	if (!signatures || signatures.length === 0) {
		return true;
	}

	// Read first 16 bytes (covers most signatures)
	const buffer = await file.arrayBuffer();
	const bytes = new Uint8Array(buffer.slice(0, 16));

	// Check if any of the signatures match
	return signatures.some((sig) => sig.every((byte, i) => bytes[i] === byte));
}

/**
 * Parses `multipart/form-data` request, separating standard fields from files.
 * Streams files into the configured storage driver with validation.
 *
 * Throws `BadRequestError` if validation fails (size, MIME type, or required fields).
 *
 * @example
 * const result = await handleUploads(ctx, {
 *   storage: new LocalDiskStorage('./uploads'),
 *   maxFileSize: 2 * 1024 * 1024,
 *   allowedMimeTypes: ['image/png', 'image/jpeg'],
 *   fields: {
 *     avatar: { required: true },
 *     document: { required: true, maxFileSize: 10 * 1024 * 1024 },
 *   },
 * });
 * // result.fields.avatar  → UploadedFile (required = true)
 * // result.fields.document → UploadedFile (required = true)
 */
export async function handleUploads<
	F extends Record<string, UploadFieldConfig> = Record<
		string,
		UploadFieldConfig
	>,
>(
	// biome-ignore lint/suspicious/noExplicitAny: Context is generic
	ctx: Context<any, any>,
	options: UploadOptionsWithFields<F>,
): Promise<ParseUploadResult<F>> {
	const contentType = ctx.request.headers.get("content-type") || "";
	if (!contentType.includes("multipart/form-data")) {
		throw new BadRequestError(
			"Invalid content-type. Must be multipart/form-data",
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Undici types conflict with lib.dom FormData
	let formData: any;
	try {
		formData = await ctx.formData();
	} catch (_err) {
		throw new BadRequestError("Failed to parse form data");
	}

	const textFields: Record<string, string> = {};
	const files: (UploadedFile | ImageUploadedFile)[] = [];
	const fileMap: Record<string, UploadedFile | ImageUploadedFile | (UploadedFile | ImageUploadedFile)[]> = {};

	const fieldWhitelist = options.fields;

	for (const [key, value] of formData.entries()) {
		if (value instanceof File) {
			// If a fields whitelist is defined, ignore unknown file fields
			if (fieldWhitelist && !(key in fieldWhitelist)) {
				continue;
			}

			// Per-field config
			const fieldConfig = fieldWhitelist?.[key];

			// Validation: Size - per-field config overrides global
			const maxFileSize = fieldConfig?.maxFileSize ?? options.maxFileSize;
			if (maxFileSize && value.size > maxFileSize) {
				throw new BadRequestError(
					`File "${value.name}" in field "${key}" exceeds max size of ${maxFileSize} bytes`,
				);
			}

			// Validation: MIME Type - per-field config overrides global
			const allowedMimeTypes =
				fieldConfig?.allowedMimeTypes ?? options.allowedMimeTypes;
			if (allowedMimeTypes && !allowedMimeTypes.includes(value.type as MimeType)) {
				throw new BadRequestError(
					`File type "${value.type}" is not allowed for field "${key}" (file: "${value.name}")`,
				);
			}

			// Validation: Magic Bytes - verify file signature matches claimed MIME type
			if (options.verifyMagicBytes !== false) {
				const isValid = await verifyFileSignature(value, value.type);
				if (!isValid) {
					throw new BadRequestError(
						`File "${value.name}" has invalid magic bytes for type "${value.type}"`,
					);
				}
			}

			// Process file
			const { name, ext } = resolveFilename(
				value.name,
				value,
				fieldConfig?.filename,
				options.filename,
			);

			// Check if image conversion is requested
			const outputFormat = fieldConfig?.outputFormat;
			let fileToStore = value;
			let finalExt = ext;
			let finalType = value.type;

			if (outputFormat && isImageMime(value.type)) {
				const info = OUTPUT_FORMAT_MAP[outputFormat];
				if (info) {
					fileToStore = await convertImage(value, outputFormat);
					finalExt = info.ext;
					finalType = info.type;
				}
			}

			const uploaded = await options.storage.handleFile(fileToStore, name, finalExt);

			// Image metadata extraction + type narrowing
			let result: UploadedFile | ImageUploadedFile;
			if (outputFormat && isImageMime(value.type)) {
				const metadata = await getImageMetadata(fileToStore);
				const imgResult: ImageUploadedFile = {
					...uploaded,
					kind: "image",
					width: metadata?.width ?? 0,
					height: metadata?.height ?? 0,
					format: OUTPUT_FORMAT_MAP[outputFormat]?.ext.slice(1) ?? outputFormat,
					type: finalType,
					ext: finalExt,
				};
				// Track original type if conversion happened
				if (value.type !== finalType) {
					imgResult.originalType = value.type;
					imgResult.originalExt = getFileExtension(value.name);
				}
				result = imgResult;
			} else {
				result = uploaded;
			}

			files.push(result);

			// Build fileMap: if same key appears multiple times → array
			if (key in fileMap) {
				const existing = fileMap[key];
				if (Array.isArray(existing)) {
					existing.push(result);
				} else {
					fileMap[key] = [existing as UploadedFile, result];
				}
			} else {
				fileMap[key] = result;
			}
		} else {
			textFields[key] = value.toString();
		}
	}

	// Post-process: fields with multiple:true must always be arrays
	if (fieldWhitelist) {
		for (const [fieldName, config] of Object.entries(fieldWhitelist)) {
			if (config.multiple && fieldName in fileMap) {
				const val = fileMap[fieldName];
				if (!Array.isArray(val)) {
					fileMap[fieldName] = [val as UploadedFile | ImageUploadedFile];
				}
			}
		}
	}

	// Validate required fields
	if (fieldWhitelist) {
		for (const [fieldName, config] of Object.entries(fieldWhitelist)) {
			if (config.required && !(fieldName in fileMap)) {
				throw new BadRequestError(
					`Required file field "${fieldName}" is missing`,
				);
			}
		}
	}

	return {
		fields: { ...textFields, ...fileMap },
		files,
	} as ParseUploadResult<F>;
}

/**
 * Middleware that automatically parses multipart uploads and populates
 * `ctx.store.files` and `ctx.store.fields`.
 *
 * ⚠️ Throws `BadRequestError` on validation failure - ensure your route
 * handler uses `asyncHandler()` or has try/catch to propagate the error
 * to the global error handler.
 */
export function uploader(options: UploadOptions): Middleware {
	return async (ctx, next) => {
		const result = await handleUploads(ctx, options);

		ctx.store.files = result.files;
		ctx.store.fields = result.fields;

		return next();
	};
}

/**
 * Delete an uploaded file from the storage driver.
 *
 * @param storage - The StorageDriver instance used for the upload
 * @param file - The UploadedFile object (needs `.path` for LocalDiskStorage)
 * @returns true if deleted, false if not found or error
 *
 * @example
 * const result = await handleUploads(ctx, options);
 * const file = result.fileMap.avatar as UploadedFile;
 * await deleteUploadedFile(options.storage, file);
 */
export async function deleteUploadedFile(
	storage: StorageDriver,
	file: UploadedFile,
): Promise<boolean> {
	if (!storage.deleteFile) {
		return false;
	}
	const target = file.path ?? `${file.name}${file.ext}`;
	return storage.deleteFile(target);
}
