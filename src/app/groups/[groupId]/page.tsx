import { notFound } from "next/navigation";
import { GroupScene } from "@/scenes/groups";
import { createServerCaller } from "@/server/caller";

export default async function GroupPage({
	params,
}: {
	params: Promise<{ groupId: string }>;
}) {
	const { groupId } = await params;
	const caller = await createServerCaller();
	const group = await caller.groups.getGroupById({ id: groupId });
	if (!group) {
		notFound();
	}

	return <GroupScene group={group} />;
}
