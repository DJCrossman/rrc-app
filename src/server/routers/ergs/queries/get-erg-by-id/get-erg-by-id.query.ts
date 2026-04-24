import type { GetErgByIdInput } from "@/schemas";
import type { Context } from "@/server/context";
import { mapToErgDto } from "@/server/routers/ergs/common/map-to-erg-dto";

export async function getErgByIdQuery(input: GetErgByIdInput, { db }: Context) {
	const erg = await db.erg.findUnique({ where: { id: input.id } });
	if (!erg) return null;

	const agg = await db.activity.aggregate({
		where: { ergId: input.id, type: "erg" },
		_sum: { distance: true },
	});

	return mapToErgDto({ erg, meters: agg._sum.distance ?? 0 });
}
