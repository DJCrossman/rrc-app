import type { UpdateBoat } from "@/schemas";
import type { Context } from "@/server/context";
import {
	convertWeightToKg,
	mapToBoatDto,
} from "@/server/routers/boats/common/map-to-boat-dto";

export async function updateBoatCommand(input: UpdateBoat, { db }: Context) {
	const boat = await db.boat.update({
		where: { id: input.id },
		data: {
			name: input.name,
			manufacturer: input.manufacturer,
			seats: input.seats,
			rigging: input.rigging,
			weightMinKg: convertWeightToKg({
				value: input.weightRange.min,
				unit: input.weightRange.unit,
			}),
			weightMaxKg: convertWeightToKg({
				value: input.weightRange.max,
				unit: input.weightRange.unit,
			}),
			preferredWeightUnit: input.weightRange.unit,
		},
	});

	const agg = await db.activity.aggregate({
		where: { boatId: input.id, type: "water" },
		_sum: { distance: true },
	});

	return mapToBoatDto({ boat, meters: agg._sum.distance ?? 0 });
}
