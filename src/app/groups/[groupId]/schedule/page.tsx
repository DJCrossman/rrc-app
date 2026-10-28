import { notFound } from "next/navigation";
import {
	loadSchedulePage,
	scheduleQuerySchema,
} from "@/app/schedule/load-schedule-page";
import { GroupScheduleScene } from "@/scenes/groups";
import { createServerCaller } from "@/server/caller";

export default async function GroupSchedulePage({
	params,
	searchParams,
}: {
	params: Promise<{ groupId: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { groupId } = await params;
	const query = scheduleQuerySchema.parse(await searchParams);
	const caller = await createServerCaller();
	const [group, props] = await Promise.all([
		caller.groups.getGroupById({ id: groupId }),
		loadSchedulePage(caller, { ...query, group: groupId }),
	]);
	if (!group) {
		notFound();
	}

	return (
		<GroupScheduleScene
			{...props}
			// The route already scopes to the group, so links leave it out.
			filters={{ ...props.filters, group: undefined }}
			group={group}
		/>
	);
}
