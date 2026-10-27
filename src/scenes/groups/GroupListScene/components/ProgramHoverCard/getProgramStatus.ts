import { DateTime } from "luxon";
import type { Programs } from "@/lib/trpc/types";

export type ProgramStatus = "active" | "upcoming" | "ended";

export function getProgramStatus({
	startDate,
	endDate,
}: Pick<Programs[number], "startDate" | "endDate">): ProgramStatus {
	const today = DateTime.now().toISODate();
	if (startDate && today < startDate.slice(0, 10)) return "upcoming";
	if (endDate && today > endDate.slice(0, 10)) return "ended";
	return "active";
}
