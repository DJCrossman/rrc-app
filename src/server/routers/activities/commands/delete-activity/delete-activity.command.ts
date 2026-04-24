import type { DeleteActivityInput } from "@/schemas";
import type { Context } from "@/server/context";

export async function deleteActivityCommand(
	input: DeleteActivityInput,
	{ db }: Context,
) {
	await db.activity.delete({ where: { id: input.id } });
}
