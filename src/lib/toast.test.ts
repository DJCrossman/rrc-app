import { TRPCClientError } from "@trpc/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
const openFeedback = vi.fn();

vi.mock("sonner", () => ({ toast: { error: toastError } }));
vi.mock("./feedback", async (importOriginal) => ({
	...(await importOriginal<typeof import("./feedback")>()),
	openFeedback,
}));

const { toastError: showErrorToast } = await import("./toast");

const trpcError = (code: string) =>
	new TRPCClientError("Server said no", {
		result: {
			error: {
				code: -32603,
				message: "Server said no",
				data: { code, path: "schedule.createEvent" },
			},
		},
	});

beforeEach(() => {
	toastError.mockReset();
	openFeedback.mockReset();
});

describe("toastError", () => {
	it("offers a Report action for unexpected server errors", () => {
		showErrorToast(trpcError("INTERNAL_SERVER_ERROR"));

		const [message, options] = toastError.mock.calls[0];
		expect(message).toBe("Server said no");
		options.action.onClick();
		expect(openFeedback).toHaveBeenCalledWith({
			error: expect.objectContaining({
				message: "Server said no",
				procedure: "schedule.createEvent",
			}),
		});
	});

	it.each([
		"BAD_REQUEST",
		"FORBIDDEN",
		"NOT_FOUND",
	])("shows a plain toast for %s", (code) => {
		showErrorToast(trpcError(code));

		expect(toastError).toHaveBeenCalledWith("Server said no", undefined);
	});

	it("offers a Report action for client-side exceptions", () => {
		showErrorToast(new TypeError("x is undefined"));

		expect(toastError.mock.calls[0][1].action.label).toBe("Report");
	});
});
