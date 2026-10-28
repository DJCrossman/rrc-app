"use client";

import { useState } from "react";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import { FilterChip } from "@/scenes/schedule/ScheduleScene/components";
import { ClubWeekCards } from "./ClubWeekCards";

export const ClubWeekSection = () => {
	const [groupId, setGroupId] = useState<string | null>(null);
	const myGroupsQuery = trpcClient.groups.getMyGroups.useQuery();
	const channelsQuery = trpcClient.chat.getChannels.useQuery();
	const myGroups = myGroupsQuery.data?.data ?? [];
	const group = myGroups.find(({ id }) => id === groupId);

	return (
		<section className="flex flex-col gap-3 px-4 lg:px-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-base font-semibold">This week at the club</h2>
				{myGroups.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						<FilterChip isActive={!group} onClick={() => setGroupId(null)}>
							All my groups
						</FilterChip>
						{myGroups.map(({ id, name }) => (
							<FilterChip
								key={id}
								isActive={group?.id === id}
								onClick={() => setGroupId(id)}
							>
								{name}
							</FilterChip>
						))}
					</div>
				)}
			</div>
			<ClubWeekCards
				key={group?.id ?? "mine"}
				group={
					group && {
						id: group.id,
						channelId: channelsQuery.data?.data.find(
							(channel) => channel.groupId === group.id,
						)?.id,
						// The chips are the viewer's own groups.
						canChat: true,
					}
				}
				scheduleHref={routes.schedule.list({ group: group?.id })}
			/>
		</section>
	);
};
