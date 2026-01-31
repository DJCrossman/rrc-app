import { describe, expect, it } from "vitest";
import {
	formatDuration,
	formatDurationAsTime,
	formatDurationWithMillis,
} from "./formatDuration";

describe("formatDuration", () => {
	it("should format zero duration", () => {
		expect(formatDuration(0)).toBe("0s");
	});

	it("should format seconds only", () => {
		expect(formatDuration(5000)).toBe("5s");
		expect(formatDuration(30000)).toBe("30s");
		expect(formatDuration(59000)).toBe("59s");
	});

	it("should format minutes and seconds", () => {
		expect(formatDuration(60000)).toBe("1m");
		expect(formatDuration(65000)).toBe("1m 5s");
		expect(formatDuration(125000)).toBe("2m 5s");
	});

	it("should format hours, minutes and seconds", () => {
		expect(formatDuration(3600000)).toBe("1h");
		expect(formatDuration(3665000)).toBe("1h 1m 5s");
		expect(formatDuration(7325000)).toBe("2h 2m 5s");
	});

	it("should omit zero values in the middle", () => {
		expect(formatDuration(3605000)).toBe("1h 5s");
	});
});

describe("formatDurationAsTime", () => {
	it("should format zero duration as 00:00:00", () => {
		expect(formatDurationAsTime(0)).toBe("00:00:00");
	});

	it("should format seconds with zero padding", () => {
		expect(formatDurationAsTime(5000)).toBe("00:00:05");
		expect(formatDurationAsTime(30000)).toBe("00:00:30");
	});

	it("should format minutes and seconds with zero padding", () => {
		expect(formatDurationAsTime(60000)).toBe("00:01:00");
		expect(formatDurationAsTime(65000)).toBe("00:01:05");
		expect(formatDurationAsTime(125000)).toBe("00:02:05");
	});

	it("should format hours, minutes and seconds with zero padding", () => {
		expect(formatDurationAsTime(3600000)).toBe("01:00:00");
		expect(formatDurationAsTime(3665000)).toBe("01:01:05");
		expect(formatDurationAsTime(7325000)).toBe("02:02:05");
	});

	it("should handle hours >= 10", () => {
		expect(formatDurationAsTime(36000000)).toBe("10:00:00");
		expect(formatDurationAsTime(86400000)).toBe("24:00:00");
	});
});

describe("formatDurationWithMillis", () => {
	it("should format zero duration with milliseconds", () => {
		expect(formatDurationWithMillis(0)).toBe("00:00.000");
	});

	it("should format seconds with milliseconds", () => {
		expect(formatDurationWithMillis(5123)).toBe("00:05.123");
		expect(formatDurationWithMillis(30456)).toBe("00:30.456");
	});

	it("should format minutes and seconds with milliseconds", () => {
		expect(formatDurationWithMillis(60000)).toBe("01:00.000");
		expect(formatDurationWithMillis(65123)).toBe("01:05.123");
		expect(formatDurationWithMillis(125789)).toBe("02:05.789");
	});

	it("should pad seconds and milliseconds correctly", () => {
		expect(formatDurationWithMillis(1001)).toBe("00:01.001");
		expect(formatDurationWithMillis(60010)).toBe("01:00.010");
	});

	it("should handle hours by converting to minutes", () => {
		expect(formatDurationWithMillis(3600000)).toBe("60:00.000");
		expect(formatDurationWithMillis(3665123)).toBe("61:05.123");
	});
});
