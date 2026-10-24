import { describe, expect, it } from "vitest";
import { countResponses } from "./count-responses";

describe("countResponses", () => {
	it("counts each status and the audience members who have not replied", () => {
		const counts = countResponses(
			[
				{ athleteId: "a", status: "yes" },
				{ athleteId: "b", status: "yes" },
				{ athleteId: "c", status: "maybe" },
				{ athleteId: "d", status: "no" },
			],
			new Set(["a", "b", "c", "d", "e", "f"]),
		);
		expect(counts).toEqual({ going: 2, maybe: 1, no: 1, noReply: 2 });
	});

	it("does not count responders outside the audience as no-reply", () => {
		const counts = countResponses(
			[{ athleteId: "outsider", status: "yes" }],
			new Set(["a", "b"]),
		);
		expect(counts).toEqual({ going: 1, maybe: 0, no: 0, noReply: 2 });
	});

	it("handles an empty audience", () => {
		expect(countResponses([], new Set())).toEqual({
			going: 0,
			maybe: 0,
			no: 0,
			noReply: 0,
		});
	});
});
