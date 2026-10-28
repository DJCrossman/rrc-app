"use client";

import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Group } from "@/lib/trpc/types";
import {
	ClubWeekCards,
	LeaderboardTable,
	LeaderboardTableSkeleton,
	MetersTimeSeriesChart,
	MetersTimeSeriesChartSkeleton,
} from "@/scenes/dashboard/DashboardScene/components";
import { GroupMembersCard, GroupShell } from "./components";

interface GroupSceneProps {
	group: Group;
}

export const GroupScene = ({ group }: GroupSceneProps) => {
	const { isAdmin } = useCurrentUser();
	const [period, setPeriod] = useState<
		"three_months" | "thirty_days" | "seven_days"
	>("three_months");
	const metersQuery = trpcClient.analytics.getGroupMeters.useQuery({
		id: group.id,
	});
	const leaderboardQuery = trpcClient.analytics.getLeaderboard.useQuery();
	const memberIds = useMemo(
		() => new Set(group.members.map((member) => member.id)),
		[group.members],
	);
	const scheduleRoutes = routes.groups.schedule(group.id);

	return (
		<GroupShell group={group} active="overview">
			<div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
				<div className="px-4 lg:px-6">
					<ClubWeekCards
						group={{ id: group.id, channelId: group.channelId }}
						scheduleHref={scheduleRoutes.list()}
						responsesHref={(eventId) => scheduleRoutes.view({ id: eventId })}
					>
						<GroupMembersCard group={group} isAdmin={isAdmin} />
					</ClubWeekCards>
				</div>
				<div className="px-4 lg:px-6">
					{metersQuery.isPending ? (
						<MetersTimeSeriesChartSkeleton />
					) : (
						<MetersTimeSeriesChart
							data={metersQuery.data?.metersTimeSeries ?? []}
							scopeLabel={group.name}
							timeRange={period}
							setTimeRange={setPeriod}
						/>
					)}
				</div>
				{leaderboardQuery.isPending ? (
					<LeaderboardTableSkeleton />
				) : (
					<LeaderboardTable
						data={(leaderboardQuery.data?.data ?? []).filter((row) =>
							memberIds.has(row.id),
						)}
						initialProgramIds={group.programs.map((program) => program.id)}
					/>
				)}
			</div>
		</GroupShell>
	);
};
