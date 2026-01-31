import { describe, expect, it } from "vitest";
import { formatMeters } from "./formatMeters";

describe("formatMeters", () => {
	it("should format meters without thousand separators for small values", () => {
		expect(formatMeters(0)).toBe("0 m");
		expect(formatMeters(1)).toBe("1 m");
		expect(formatMeters(999)).toBe("999 m");
	});

	it("should format meters with thousand separators for values >= 1,000", () => {
		expect(formatMeters(1000)).toBe("1,000 m");
		expect(formatMeters(5000)).toBe("5,000 m");
		expect(formatMeters(10000)).toBe("10,000 m");
	});

	it("should format meters with thousand separators for large values < 100,000", () => {
		expect(formatMeters(50000)).toBe("50,000 m");
		expect(formatMeters(99999)).toBe("99,999 m");
	});

	it("should format as kilometers with one decimal for values >= 100,000", () => {
		expect(formatMeters(100000)).toBe("100.0 km");
		expect(formatMeters(105500)).toBe("105.5 km");
		expect(formatMeters(123456)).toBe("123.5 km");
	});

	it("should format very large distances in kilometers", () => {
		expect(formatMeters(1000000)).toBe("1,000.0 km");
		expect(formatMeters(5555555)).toBe("5,555.6 km");
	});

	it("should handle decimal precision correctly for kilometers", () => {
		expect(formatMeters(100499)).toBe("100.5 km"); // rounds 0.499 to 0.5
		expect(formatMeters(100550)).toBe("100.6 km"); // rounds 0.55 to 0.6
	});
});
