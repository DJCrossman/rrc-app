import type { UpdateErg } from "@/schemas";
import type { Context } from "@/server/context";
import { mapToErgDto } from "@/server/routers/ergs/common/map-to-erg-dto";

export async function updateErgCommand(input: UpdateErg, { db }: Context) {
	const erg = await db.erg.update({
		where: { id: input.id },
		data: {
			name: input.name,
			manufacturer: input.manufacturer,
			firmwareVersion: input.firmwareVersion,
			hardwareVersion: input.hardwareVersion,
			serialNumber: input.serialNumber,
			dataCode: input.dataCode,
		},
	});

	const agg = await db.activity.aggregate({
		where: { ergId: input.id, type: "erg" },
		_sum: { distance: true },
	});

	return mapToErgDto({ erg, meters: agg._sum.distance ?? 0 });
}
