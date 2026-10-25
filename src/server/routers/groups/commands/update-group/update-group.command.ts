import type { UpdateGroup } from "@/schemas";
import type { Context } from "@/server/context";
import { findGroupOrThrow } from "../../common/find-group-or-throw";

export async function updateGroupCommand(
	{ id, name, programIds }: UpdateGroup,
	{ db }: Context,
) {
	await findGroupOrThrow(db, id);
	return db.group.update({
		where: { id },
		data: {
			name,
			programs: programIds && {
				deleteMany: { programId: { notIn: programIds } },
				createMany: {
					data: programIds.map((programId) => ({ programId })),
					skipDuplicates: true,
				},
			},
		},
		select: { id: true, name: true },
	});
}
