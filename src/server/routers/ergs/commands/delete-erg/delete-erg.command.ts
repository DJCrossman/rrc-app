import type { DeleteErgInput } from "@/schemas";
import type { Context } from "@/server/context";

export async function deleteErgCommand(
	input: DeleteErgInput,
	{ db }: Context,
): Promise<boolean> {
	await db.erg.delete({ where: { id: input.id } });
	return true;
}
