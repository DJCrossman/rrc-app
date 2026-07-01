import type { z } from "zod";
import { paginate } from "@/lib/pagination";
import { withPagination } from "@/schemas";
import type { Context } from "@/server/context";
import { mapToErgDto } from "@/server/routers/ergs/common/map-to-erg-dto";

export const getErgsInputSchema = withPagination({
	columns: ["name", "manufacturer", "serialNumber", "firmwareVersion"] as const,
});
export type GetErgsInput = z.infer<typeof getErgsInputSchema>;

export async function getErgsQuery(input: GetErgsInput, { db }: Context) {
	const { page, pageSize = 20, sortBy, order } = input;

	const [ergs, totalCount] = await Promise.all([
		db.erg.findMany({
			orderBy: { [sortBy ?? "id"]: order ?? "asc" },
			take: pageSize,
			skip: ((page ?? 1) - 1) * pageSize,
		}),
		db.erg.count(),
	]);

	const metersAgg = await db.activity.groupBy({
		by: ["ergId"],
		where: { type: "erg", ergId: { in: ergs.map((erg) => erg.id) } },
		_sum: { distance: true },
	});

	const metersMap = new Map(
		metersAgg
			.filter((r): r is typeof r & { ergId: string } => r.ergId != null)
			.map((r) => [r.ergId, r._sum.distance ?? 0]),
	);

	const data = ergs.map((erg) =>
		mapToErgDto({ erg, meters: metersMap.get(erg.id) ?? 0 }),
	);

	return paginate({ data, totalCount, page, pageSize });
}
