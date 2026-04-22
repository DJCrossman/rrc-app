"use server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { CreateErg } from "@/schemas";
import { mapToErgDto } from "./utils";

export const getErgs = async () => {
	await requireAuth();

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
};

export async function getErgById(id: string) {
	await requireAuth();

	const erg = await db.erg.findUnique({ where: { id } });
	if (!erg) return null;

	const agg = await db.activity.aggregate({
		where: { ergId: id, type: "erg" },
		_sum: { distance: true },
	});

	return mapToErgDto({ erg, meters: agg._sum.distance ?? 0 });
}

export const createErg = async (data: CreateErg) => {
	await requireAuth();

	const erg = await db.erg.create({
		data: {
			name: data.name,
			manufacturer: data.manufacturer,
			firmwareVersion: data.firmwareVersion,
			hardwareVersion: data.hardwareVersion,
			serialNumber: data.serialNumber,
			dataCode: data.dataCode,
		},
	});
	return mapToErgDto({ erg, meters: 0 });
};

export const updateErg = async (data: Erg) => {
	await requireAuth();

	const erg = await db.erg.update({
		where: { id: data.id },
		data: {
			name: data.name,
			manufacturer: data.manufacturer,
			firmwareVersion: data.firmwareVersion,
			hardwareVersion: data.hardwareVersion,
			serialNumber: data.serialNumber,
			dataCode: data.dataCode,
		},
	});

	const agg = await db.activity.aggregate({
		where: { ergId: data.id, type: "erg" },
		_sum: { distance: true },
	});

	return mapToErgDto({ erg, meters: agg._sum.distance ?? 0 });
};

export const deleteErg = async (id: string): Promise<boolean> => {
	await requireAuth();

	await db.erg.delete({ where: { id } });
	return true;
};

export type Erg = NonNullable<Awaited<ReturnType<typeof getErgById>>>;
export type Ergs = Awaited<ReturnType<typeof getErgs>>["data"];
