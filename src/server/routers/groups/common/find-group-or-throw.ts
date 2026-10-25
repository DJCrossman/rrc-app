import { TRPCError } from "@trpc/server";
import type { GroupsDb } from "./group-members";

export async function findGroupOrThrow(db: GroupsDb, groupId: string) {
	const group = await db.group.findUnique({
		where: { id: groupId },
		select: { id: true },
	});
	if (!group) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
	}
	return group;
}
