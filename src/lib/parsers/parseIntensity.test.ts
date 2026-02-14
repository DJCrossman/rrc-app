import { describe, expect, it } from "vitest";
import { parseIntensity } from "./parseIntensity";

describe("parseIntensity", () => {
	it("should parse C1 from description", () => {
		expect(parseIntensity("60' C1; 3x500m @ max effort")).toBe("C1");
	});

	it("should parse C2 from description", () => {
		expect(parseIntensity("70' C2; 2x2km w/5' rest")).toBe("C2");
	});

	it("should parse C3 from description", () => {
		expect(parseIntensity("80' C3; Tempo work")).toBe("C3");
	});

	it("should parse C4 from description", () => {
		expect(parseIntensity("70' C4; Active recovery")).toBe("C4");
	});

	it("should parse C5 from description", () => {
		expect(parseIntensity("90' C5; Easy steady state")).toBe("C5");
	});

	it("should parse C6 from description", () => {
		expect(parseIntensity("60' C6; 3x3km w/4' rest")).toBe("C6");
	});

	it("should be case insensitive", () => {
		expect(parseIntensity("60' c1; test")).toBe("C1");
		expect(parseIntensity("70' c6; test")).toBe("C6");
	});

	it("should default to C6 when no intensity found", () => {
		expect(parseIntensity("60' Steady State")).toBe("C6");
		expect(parseIntensity("20' warm up; 2x2km @ R20")).toBe("C6");
		expect(parseIntensity("2000m time trial")).toBe("C6");
	});

	it("should find intensity anywhere in description", () => {
		expect(parseIntensity("70' C6 SS; 80' steps")).toBe("C6");
		expect(parseIntensity("Steady State with C3 effort")).toBe("C3");
	});

	it("should ignore invalid intensity numbers", () => {
		expect(parseIntensity("C7 invalid")).toBe("C6");
		expect(parseIntensity("C0 invalid")).toBe("C6");
		expect(parseIntensity("C99 invalid")).toBe("C6");
	});
});
