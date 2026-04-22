"use server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { CreateBoat } from "@/schemas";
import { convertWeightToKg, mapToBoatDto } from "./utils";

export const getBoats = async () => {
	await requireAuth();

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
};

export async function getBoatById(id: string) {
	await requireAuth();

	const boat = await db.boat.findUnique({ where: { id } });
	if (!boat) return null;

	const agg = await db.activity.aggregate({
		where: { boatId: id, type: "water" },
		_sum: { distance: true },
	});

	return mapToBoatDto({ boat, meters: agg._sum.distance ?? 0 });
}

export const createBoat = async (data: CreateBoat) => {
	await requireAuth();

	const boat = await db.boat.create({
		data: {
			name: data.name,
			manufacturer: data.manufacturer,
			seats: data.seats,
			rigging: data.rigging,
			weightMinKg: convertWeightToKg({
				value: data.weightRange.min,
				unit: data.weightRange.unit,
			}),
			weightMaxKg: convertWeightToKg({
				value: data.weightRange.max,
				unit: data.weightRange.unit,
			}),
			preferredWeightUnit: data.weightRange.unit,
		},
	});
	return mapToBoatDto({ boat, meters: 0 });
};

export const updateBoat = async (data: Boat) => {
	await requireAuth();

	const boat = await db.boat.update({
		where: { id: data.id },
		data: {
			name: data.name,
			manufacturer: data.manufacturer,
			seats: data.seats,
			rigging: data.rigging,
			weightMinKg: convertWeightToKg({
				value: data.weightRange.min,
				unit: data.weightRange.unit,
			}),
			weightMaxKg: convertWeightToKg({
				value: data.weightRange.max,
				unit: data.weightRange.unit,
			}),
			preferredWeightUnit: data.weightRange.unit,
		},
	});

	const agg = await db.activity.aggregate({
		where: { boatId: data.id, type: "water" },
		_sum: { distance: true },
	});

	return mapToBoatDto({ boat, meters: agg._sum.distance ?? 0 });
};

export type Boat = NonNullable<Awaited<ReturnType<typeof getBoatById>>>;
export type Boats = Awaited<ReturnType<typeof getBoats>>["data"];
