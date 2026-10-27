import { describe, expect, it } from "vitest";
import { formatDistance } from "./formatDistance";

describe("formatDistance", () => {
	it("shows metres below a kilometre", () => {
		expect(formatDistance(0)).toBe("0 m");
		expect(formatDistance(250)).toBe("250 m");
		expect(formatDistance(999)).toBe("999 m");
	});

	it("switches to kilometres at a kilometre", () => {
		expect(formatDistance(1000)).toBe("1 km");
		expect(formatDistance(1370)).toBe("1.4 km");
		expect(formatDistance(18_400)).toBe("18.4 km");
	});

	it("keeps planning totals readable", () => {
		expect(formatDistance(150_000)).toBe("150 km");
		expect(formatDistance(895_000)).toBe("895 km");
	});

	it("uses compact notation past a thousand kilometres", () => {
		expect(formatDistance(1_370_000)).toBe("1.4K km");
		expect(formatDistance(12_500_000)).toBe("12.5K km");
	});

	it("rounds sub-metre values rather than showing decimals", () => {
		expect(formatDistance(249.6)).toBe("250 m");
	});
});
