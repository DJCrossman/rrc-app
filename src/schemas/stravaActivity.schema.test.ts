import { describe, expect, it } from "vitest";
import { stravaActivitySchema } from "./stravaActivity.schema";

describe("stravaActivitySchema", () => {
	it("accepts manual activities, which have no upload", () => {
		const { external_id, upload_id } = stravaActivitySchema.shape;
		expect(external_id.safeParse(null).success).toBe(true);
		expect(upload_id.safeParse(null).success).toBe(true);
	});
});
