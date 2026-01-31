import { describe, expect, it } from "vitest";
import { formatPercent } from "./formatPercent";

describe("formatPercent", () => {
	it("should format zero percent", () => {
		expect(formatPercent(0)).toBe("0%");
	});

	it("should format positive percentages with + sign", () => {
		expect(formatPercent(0.05)).toBe("+5%");
		expect(formatPercent(0.1)).toBe("+10%");
		expect(formatPercent(0.5)).toBe("+50%");
		expect(formatPercent(1)).toBe("+100%");
	});

	it("should format negative percentages without + sign", () => {
		expect(formatPercent(-0.05)).toBe("-5%");
		expect(formatPercent(-0.1)).toBe("-10%");
		expect(formatPercent(-0.5)).toBe("-50%");
		expect(formatPercent(-1)).toBe("-100%");
	});

	it("should format with one decimal place", () => {
		expect(formatPercent(0.055)).toBe("+5.5%");
		expect(formatPercent(0.123)).toBe("+12.3%");
		expect(formatPercent(-0.075)).toBe("-7.5%");
	});

	it("should round to one decimal place", () => {
		expect(formatPercent(0.0555)).toBe("+5.6%");
		expect(formatPercent(0.1234)).toBe("+12.3%");
	});

	it("should handle very small positive percentages", () => {
		expect(formatPercent(0.001)).toBe("+0.1%");
	});

	it("should handle very small negative percentages", () => {
		expect(formatPercent(-0.001)).toBe("-0.1%");
	});
});
