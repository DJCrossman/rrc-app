import { describe, expect, it } from "vitest";
import {
	concept2WebhookEventSchema,
	getConcept2WebhookUserId,
} from "./concept2Webhook.schema";

// Trimmed result as Concept2 actually sends it on result-added: no
// calories/stroke/heart-rate/interval data, and `comments` null.
const trimmedResult = {
	id: 1234,
	user_id: 5678,
	date: "2026-09-20 18:36:00",
	timezone: "America/Regina",
	date_utc: "2026-09-21 00:36:00",
	distance: 5000,
	type: "rower",
	time: 12000,
	time_formatted: "20:00.0",
	workout_type: "FixedDistanceSplits",
	source: "ErgData",
	weight_class: "H",
	verified: false,
	ranked: false,
	comments: null,
	privacy: "private",
	stroke_data: false,
};

const fullResult = {
	...trimmedResult,
	comments: "felt good",
	calories_total: 300,
	stroke_count: 1100,
	stroke_rate: 24,
	heart_rate: { average: 150, min: 90, max: 178, ending: 160 },
	workout: {
		intervals: [
			{
				type: "distance",
				time: 600,
				distance: 2500,
				calories_total: 150,
				stroke_rate: 24,
			},
		],
	},
};

describe("concept2WebhookEventSchema", () => {
	it("accepts the trimmed result-added payload sent in production", () => {
		const parsed = concept2WebhookEventSchema.safeParse({
			type: "result-added",
			result: trimmedResult,
		});
		expect(parsed.success).toBe(true);
	});

	it("accepts the `data`-wrapped envelope Concept2 documents", () => {
		const parsed = concept2WebhookEventSchema.safeParse({
			data: { type: "result-added", result: trimmedResult },
		});
		expect(parsed.success).toBe(true);
		expect(parsed.success && parsed.data.result?.id).toBe(1234);
	});

	it("accepts result-deleted, which carries only a result id", () => {
		expect(
			concept2WebhookEventSchema.safeParse({
				type: "result-deleted",
				result_id: 745,
			}).success,
		).toBe(true);
		expect(
			concept2WebhookEventSchema.safeParse({
				data: { type: "result-deleted", result_id: 745 },
			}).success,
		).toBe(true);
	});

	it("keeps the rich fields of a full API result", () => {
		const parsed = concept2WebhookEventSchema.safeParse({
			type: "result-updated",
			result: fullResult,
		});
		expect(parsed.success).toBe(true);
		expect(
			parsed.success && parsed.data.result?.workout?.intervals,
		).toHaveLength(1);
		expect(parsed.success && parsed.data.result?.heart_rate?.average).toBe(150);
	});

	it("tolerates null timezone and date_utc", () => {
		const parsed = concept2WebhookEventSchema.safeParse({
			type: "result-added",
			result: { ...trimmedResult, timezone: null, date_utc: null },
		});
		expect(parsed.success).toBe(true);
	});

	it("still rejects an unknown event type", () => {
		expect(
			concept2WebhookEventSchema.safeParse({ type: "result-archived" }).success,
		).toBe(false);
	});
});

describe("getConcept2WebhookUserId", () => {
	it("falls back to the result's user_id when the event omits it", () => {
		const parsed = concept2WebhookEventSchema.parse({
			type: "result-added",
			result: trimmedResult,
		});
		expect(getConcept2WebhookUserId(parsed)).toBe(5678);
	});

	it("prefers the event's own user_id", () => {
		const parsed = concept2WebhookEventSchema.parse({
			type: "result-updated",
			user_id: 42,
			result: trimmedResult,
		});
		expect(getConcept2WebhookUserId(parsed)).toBe(42);
	});

	it("is undefined when no user_id is reachable", () => {
		const parsed = concept2WebhookEventSchema.parse({
			type: "result-deleted",
			result_id: 745,
		});
		expect(getConcept2WebhookUserId(parsed)).toBeUndefined();
	});
});
