import { paginate } from "@/lib/pagination";
import type { Context } from "@/server/context";

export async function getProgramsQuery(_input: undefined, { db }: Context) {
	const [programs, totalCount] = await Promise.all([
		db.program.findMany({
			include: { _count: { select: { memberships: true } } },
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
		syncedAt: p.syncedAt?.toISOString() ?? null,
		memberCount: p._count.memberships,
	}));
	return paginate({ data, totalCount });
}
