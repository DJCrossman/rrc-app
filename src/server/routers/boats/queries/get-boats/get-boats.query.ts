import type { Context } from "@/server/context";
import { mapToBoatDto } from "@/server/routers/boats/common/map-to-boat-dto";

export async function getBoatsQuery(_input: undefined, { db }: Context) {
	const [boats, metersAgg] = await Promise.all([
		db.boat.findMany({ orderBy: { id: "asc" } }),
		db.activity.groupBy({
			by: ["boatId"],
			where: { type: "water", boatId: { not: null } },
			_sum: { distance: true },
		}),
	]);

	const metersMap = new Map(
		metersAgg
			.filter((r): r is typeof r & { boatId: string } => r.boatId != null)
			.map((r) => [r.boatId, r._sum.distance ?? 0]),
	);

	return {
		data: boats.map((boat) =>
			mapToBoatDto({ boat, meters: metersMap.get(boat.id) ?? 0 }),
		),
	};
}
