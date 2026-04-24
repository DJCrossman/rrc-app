import type { GetBoatByIdInput } from "@/schemas";
import type { Context } from "@/server/context";
import { mapToBoatDto } from "@/server/routers/boats/common/map-to-boat-dto";

export async function getBoatByIdQuery(
	input: GetBoatByIdInput,
	{ db }: Context,
) {
	const boat = await db.boat.findUnique({ where: { id: input.id } });
	if (!boat) return null;

	const agg = await db.activity.aggregate({
		where: { boatId: input.id, type: "water" },
		_sum: { distance: true },
	});

	return mapToBoatDto({ boat, meters: agg._sum.distance ?? 0 });
}
