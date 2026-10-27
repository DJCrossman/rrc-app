import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import type { ContextAthlete } from "../context";
import { resolveViewerAccess } from "./viewer-access";

const athlete = { id: "ath_1" } as unknown as ContextAthlete;

describe("resolveViewerAccess", () => {
	it("rejects signed-out requests", () => {
		expect(() => resolveViewerAccess({ user: null, athlete: null })).toThrow(
			expect.objectContaining({ code: "UNAUTHORIZED" }),
		);
	});

	it("lets an athlete through with their row", () => {
		const user = { id: "user_1", isAdmin: false };
		expect(resolveViewerAccess({ user, athlete })).toEqual({ user, athlete });
	});

	it("lets an admin through without an athlete row", () => {
		const user = { id: "user_2", isAdmin: true };
		expect(resolveViewerAccess({ user, athlete: null })).toEqual({
			user,
			athlete: null,
		});
	});

	it("rejects a member without an athlete row", () => {
		const error = (() => {
			try {
				resolveViewerAccess({
					user: { id: "user_3", isAdmin: false },
					athlete: null,
				});
			} catch (e) {
				return e;
			}
		})();
		expect(error).toBeInstanceOf(TRPCError);
		expect((error as TRPCError).code).toBe("FORBIDDEN");
	});
});
