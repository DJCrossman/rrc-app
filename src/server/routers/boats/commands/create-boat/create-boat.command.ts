import type { CreateBoat } from "@/schemas";
import type { Context } from "@/server/context";
import {
	convertWeightToKg,
	mapToBoatDto,
} from "@/server/routers/boats/common/map-to-boat-dto";

export async function createBoatCommand(input: CreateBoat, { db }: Context) {
	const boat = await db.boat.create({
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
	return mapToBoatDto({ boat, meters: 0 });
}
