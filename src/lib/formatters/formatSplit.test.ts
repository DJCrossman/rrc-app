import { describe, expect, it } from "vitest";
import { formatSplit } from "./formatSplit";

describe("formatSplit", () => {
	it("should format split for 2000m in 7 minutes", () => {
		const durationMs = 7 * 60 * 1000; // 7 minutes = 420,000ms
		const distanceMeters = 2000;
		// Split per 500m = (420,000 / 2000) * 500 = 105,000ms = 105s = 1:45.000
		expect(formatSplit(durationMs, distanceMeters)).toBe("01:45.000/500m");
	});

	it("should format split for 5000m in 20 minutes", () => {
		const durationMs = 20 * 60 * 1000; // 20 minutes = 1,200,000ms
		const distanceMeters = 5000;
		// Split per 500m = (1,200,000 / 5000) * 500 = 120,000ms = 120s = 2:00.000
		expect(formatSplit(durationMs, distanceMeters)).toBe("02:00.000/500m");
	});

	it("should format split with milliseconds", () => {
		const durationMs = 426500; // 7m 6.5s
		const distanceMeters = 2000;
		// Split per 500m = (426,500 / 2000) * 500 = 106,625ms = 106.625s = 1:46.625
		expect(formatSplit(durationMs, distanceMeters)).toBe("01:46.625/500m");
	});

	it("should format fast splits under 1 minute", () => {
		const durationMs = 3 * 60 * 1000; // 3 minutes = 180,000ms
		const distanceMeters = 2000;
		// Split per 500m = (180,000 / 2000) * 500 = 45,000ms = 45s = 0:45.000
		expect(formatSplit(durationMs, distanceMeters)).toBe("00:45.000/500m");
	});

	it("should format slow splits over 2 minutes", () => {
		const durationMs = 10 * 60 * 1000; // 10 minutes = 600,000ms
		const distanceMeters = 2000;
		// Split per 500m = (600,000 / 2000) * 500 = 150,000ms = 150s = 2:30.000
		expect(formatSplit(durationMs, distanceMeters)).toBe("02:30.000/500m");
	});

	it("should pad seconds correctly", () => {
		const durationMs = 115000; // 1m 55s
		const distanceMeters = 500;
		// Split per 500m = (115,000 / 500) * 500 = 115,000ms = 115s = 1:55.000
		expect(formatSplit(durationMs, distanceMeters)).toBe("01:55.000/500m");
	});

	it("should handle very short distances", () => {
		const durationMs = 50000; // 50s
		const distanceMeters = 100;
		// Split per 500m = (50,000 / 100) * 500 = 250,000ms = 250s = 4:10.000
		expect(formatSplit(durationMs, distanceMeters)).toBe("04:10.000/500m");
	});
});
