import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { wrapBuilder } from "./builder";
import { definePermission } from "./permission";
import { baseProcedure, router } from "./trpc";

type Ctx = { user: { id: string } };

const onlyOwnNotes = definePermission<Ctx, { ownerId: string }>(
	({ ctx, input }) => ctx.user.id === input.ownerId,
	{ code: "NOT_FOUND", message: "Note not found" },
);

const handler = vi.fn(() => "the note");
const notes = router({
	get: wrapBuilder<Ctx, undefined>(baseProcedure)
		.input(z.object({ ownerId: z.string() }))
		.permission(onlyOwnNotes)
		.query(handler),
});
const callerFor = (userId: string) =>
	notes.createCaller({ user: { id: userId } } as never);

describe("permission", () => {
	it("runs the handler when the check passes", async () => {
		await expect(callerFor("user_a").get({ ownerId: "user_a" })).resolves.toBe(
			"the note",
		);
	});

	it("throws the rule's error and skips the handler when it fails", async () => {
		handler.mockClear();
		await expect(
			callerFor("user_b").get({ ownerId: "user_a" }),
		).rejects.toMatchObject({ code: "NOT_FOUND", message: "Note not found" });
		expect(handler).not.toHaveBeenCalled();
	});

	it("defaults to forbidden", async () => {
		const rule = definePermission<Ctx, undefined>(() => false);
		expect(rule.error.code).toBe("FORBIDDEN");
	});
});
