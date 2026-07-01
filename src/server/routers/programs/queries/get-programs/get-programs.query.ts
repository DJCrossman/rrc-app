import { paginate } from "@/lib/pagination";
import type { Context } from "@/server/context";

export async function getProgramsQuery(_input: undefined, { db }: Context) {
	const [programs, totalCount] = await Promise.all([
		db.program.findMany({
			orderBy: [{ name: "asc" }],
		}),
		db.program.count(),
	]);

	const data = programs.map((p) => ({
		id: p.id,
		rcaProgramId: p.rcaProgramId,
		rcaOrgId: p.rcaOrgId,
		organizationName: p.organizationName,
		name: p.name,
		description: p.description,
		startDate: p.startDate?.toISOString() ?? null,
		endDate: p.endDate?.toISOString() ?? null,
	}));
	return paginate({ data, totalCount });
}
