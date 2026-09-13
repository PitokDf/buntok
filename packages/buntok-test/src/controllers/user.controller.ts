import { Controller, Get, Post, Use } from "@buntok/core";
import { z, zValidator } from "@buntok/core/middlewares/validator";
import { handleUploads, LocalDiskStorage } from "@buntok/core/upload";
import { users } from "../../data.json";
import type { Context } from "@buntok/core";
import { NotFoundError } from "@buntok/core";
import { write } from "bun";
import { generateInitialAvatar, serveFileOrFallback } from "@buntok/core/helpers";

@Controller("/user")
export class UserController {
	private localDiskStorage = new LocalDiskStorage("./uploads/avatar");

	@Post("/upload-avatar")
	@Use(zValidator("body", { userId: z.string(), avatar: z.file() }, { contentType: "multipart/form-data" }))
	async uploadAvatar(ctx: Context) {
		const body = ctx.valid("body");
		const user = users.find((u) => u.id === (body as any).userId);
		const oldAvatarPath = user?.avatar_path;

		if (!user) {
			throw new NotFoundError(`User with ID ${(body as any).userId} not found`);
		}
		const result = await handleUploads(ctx, {
			storage: this.localDiskStorage,
			fields: {
				avatar: {
					maxFileSize: 1024 * 1024 * 5, // 5MB
					allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
					outputFormat: "webp",
				},
			},
		});

		user.avatar_path = result.fields.avatar?.path!;
		await write("./data.json", JSON.stringify({ users }, null, "\t"));

		if (oldAvatarPath && oldAvatarPath !== user.avatar_path) {
			this.localDiskStorage.deleteFile(oldAvatarPath); // Delete the old avatar file
		}
		return ctx.success(result.fields.avatar);
	}

	@Get("/avatar/:userId")
	@Use(zValidator("params", z.object({ userId: z.string() })))
	async getUserAvatar(ctx: Context) {
		const { userId } = ctx.params;

		const user = users.find((u) => u.id === userId);
		if (!user) {
			throw new NotFoundError(`User with ID ${userId} not found`);
		}

		return serveFileOrFallback(ctx, user.avatar_path, () => {
			return new Response(generateInitialAvatar(user.name, user.id), {
				headers: { "Content-Type": "image/svg+xml" },
			});
		});
	}
}
