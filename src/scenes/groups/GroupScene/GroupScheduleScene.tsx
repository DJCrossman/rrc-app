"use client";

import { routes } from "@/lib/routes";
import type { Group } from "@/lib/trpc/types";
import {
	ScheduleView,
	type ScheduleViewProps,
} from "@/scenes/schedule/ScheduleScene/ScheduleView";
import { GroupShell } from "./components";

interface GroupScheduleSceneProps extends ScheduleViewProps {
	group: Group;
}

export const GroupScheduleScene = ({
	group,
	...props
}: GroupScheduleSceneProps) => (
	<GroupShell group={group} active="schedule">
		<ScheduleView
			{...props}
			scheduleRoutes={routes.groups.schedule(group.id)}
		/>
	</GroupShell>
);
