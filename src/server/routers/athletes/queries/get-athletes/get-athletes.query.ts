import { z } from "zod";
import { paginate } from "@/lib/pagination";
import { withPagination } from "@/schemas";
import type { Context } from "@/server/context";
import {
	athleteInclude,
	mapToAthleteDto,
} from "@/server/routers/athletes/common/map-to-athlete-dto";

export const getAthletesInputSchema = withPagination({
	columns: ["dateJoined"] as const,
}).extend({
	programIds: z.array(z.string()).optional(),
	isActive: z.boolean().optional(),
});
export type GetAthletesInput = z.infer<typeof getAthletesInputSchema>;

export async function getAthletesQuery(
	input: GetAthletesInput,
	{ db }: Context,
) {
	const { page, pageSize = 20, sortBy, order, programIds, isActive } = input;

	const now = new Date();
	const activeMembership = {
		some: { program: { startDate: { lte: now }, endDate: { gte: now } } },
	};
	const where = {
		AND: [
			...(programIds?.length
				? [{ memberships: { some: { programId: { in: programIds } } } }]
				: []),
			...(isActive === true ? [{ memberships: activeMembership }] : []),
			...(isActive === false
				? [{ NOT: { memberships: activeMembership } }]
				: []),
		],
	};

	const [rows, totalCount] = await Promise.all([
		db.athlete.findMany({
			where,
			include: athleteInclude,
			orderBy: { [sortBy ?? "id"]: order ?? "asc" },
			take: pageSize,
			skip: ((page ?? 1) - 1) * pageSize,
		}),
		db.athlete.count({ where }),
	]);

	return paginate({
		data: rows.map(mapToAthleteDto),
		totalCount,
		page,
		pageSize,
	});
}
