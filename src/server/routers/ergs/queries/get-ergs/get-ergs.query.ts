import type { Context } from "@/server/context";
import { mapToErgDto } from "@/server/routers/ergs/common/map-to-erg-dto";

export async function getErgsQuery(_input: undefined, { db }: Context) {
	const [ergs, metersAgg] = await Promise.all([
		db.erg.findMany({ orderBy: { id: "asc" } }),
		db.activity.groupBy({
			by: ["ergId"],
			where: { type: "erg", ergId: { not: null } },
			_sum: { distance: true },
		}),
	]);

	const metersMap = new Map(
		metersAgg
			.filter((r): r is typeof r & { ergId: string } => r.ergId != null)
			.map((r) => [r.ergId, r._sum.distance ?? 0]),
	);

	return {
		data: ergs.map((erg) =>
			mapToErgDto({ erg, meters: metersMap.get(erg.id) ?? 0 }),
		),
	};
}
