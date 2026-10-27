import type { ZoneMinutes } from "@/schemas";

export const toZoneRows = (zoneMinutes: ZoneMinutes | undefined) =>
	Object.entries(zoneMinutes ?? {})
		.filter(([, minutes]) => typeof minutes === "number" && minutes > 0)
		.map(([intensityCategory, minutes]) => ({
			intensityCategory: intensityCategory as keyof ZoneMinutes,
			minutes: Math.round(minutes as number),
		}));
