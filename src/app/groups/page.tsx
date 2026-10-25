import { z } from "zod";
import { GroupListScene } from "@/scenes/groups";
import { createServerCaller } from "@/server/caller";

const querySchema = z.object({
	groupId: z.string().optional(),
	action: z.literal("create").optional(),
});

export default async function GroupsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { groupId, action } = querySchema.parse(await searchParams);
	const caller = await createServerCaller();
	const [{ data: groups }, { data: programs }, selectedGroup] =
		await Promise.all([
			caller.groups.getGroups(),
			caller.programs.getPrograms(),
			groupId ? caller.groups.getGroupById({ id: groupId }) : null,
		]);

	return (
		<GroupListScene
			groups={groups}
			programs={programs}
			selectedGroup={selectedGroup}
			isCreateDrawerOpen={action === "create"}
		/>
	);
}
