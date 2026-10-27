import type { CreateGroup } from "@/schemas";
import type { Context } from "@/server/context";

export async function createGroupCommand(input: CreateGroup, { db }: Context) {
	return db.group.create({
		data: {
			name: input.name,
			programs: {
				create: (input.programIds ?? []).map((programId) => ({ programId })),
			},
		},
		select: { id: true, name: true },
	});
}
