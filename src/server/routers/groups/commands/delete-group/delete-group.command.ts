import type { DeleteGroupInput } from "@/schemas";
import type { Context } from "@/server/context";
import { findGroupOrThrow } from "../../common/find-group-or-throw";

export async function deleteGroupCommand(
	{ id }: DeleteGroupInput,
	{ db }: Context,
) {
	await findGroupOrThrow(db, id);
	await db.$transaction([
		db.channel.deleteMany({ where: { groupId: id } }),
		db.group.delete({ where: { id } }),
	]);
	return true;
}
