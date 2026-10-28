"use client";

import type { ReactNode } from "react";
import { useCurrentUser } from "@/hooks/useAuth";
import { getClubToday } from "@/lib/schedule/week";
import { withErrorToast } from "@/lib/toast";
import { trpcClient } from "@/lib/trpc/client";
import type { RsvpStatus } from "@/schemas";
import { AvailabilityCard } from "./AvailabilityCard";
import { LatestChatCard } from "./LatestChatCard";
import { MessagesCard } from "./MessagesCard";
import { NeedsReplyCard } from "./NeedsReplyCard";
import { UpNextCard } from "./UpNextCard";

// The next event plus the three "later" rows under it.
const UPCOMING_LIMIT = 4;

interface ClubWeekCardsProps {
	/** Scope to one group; leave out for everything the viewer is in. */
	group?: { id: string; channelId: string | undefined; canChat: boolean };
	scheduleHref: string;
	/** Shows the next training's availability, linking to its responses. */
	responsesHref?: (eventId: string) => string;
	children?: ReactNode;
}

export const ClubWeekCards = ({
	group,
	scheduleHref,
	responsesHref,
	children,
}: ClubWeekCardsProps) => {
	const { isAdmin } = useCurrentUser();
	const utils = trpcClient.useUtils();
	const today = getClubToday();
	const upcomingQuery = trpcClient.schedule.getUpcoming.useQuery({
		limit: UPCOMING_LIMIT,
		groupId: group?.id,
	});
	const rsvp = trpcClient.schedule.rsvp.useMutation();
	const onRsvp = async (eventId: string, status: RsvpStatus) => {
		const result = await withErrorToast(rsvp.mutateAsync({ eventId, status }));
		await utils.schedule.getUpcoming.invalidate();
		return result.status;
	};

	return (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-3">
			<UpNextCard
				events={upcomingQuery.data?.next}
				today={today}
				scheduleHref={scheduleHref}
				onRsvp={onRsvp}
			/>
			<NeedsReplyCard
				events={upcomingQuery.data?.pendingRsvps}
				today={today}
				onRsvp={onRsvp}
			/>
			{!group && <MyMessagesCard />}
			{group?.canChat && <LatestChatCard channelId={group.channelId} />}
			{responsesHref && (
				<AvailabilityCard
					event={upcomingQuery.data?.nextTraining}
					today={today}
					isAdmin={isAdmin}
					responsesHref={responsesHref}
				/>
			)}
			{children}
		</div>
	);
};

// Everyone, the viewer's groups and their direct messages.
const MyMessagesCard = () => {
	const channelsQuery = trpcClient.chat.getChannels.useQuery();
	const myGroupsQuery = trpcClient.groups.getMyGroups.useQuery();
	const myGroupIds = new Set(
		(myGroupsQuery.data?.data ?? []).map((group) => group.id),
	);
	const channels =
		channelsQuery.data && myGroupsQuery.data
			? channelsQuery.data.data.filter((channel) =>
					channel.kind === "group"
						? !!channel.groupId && myGroupIds.has(channel.groupId)
						: !channel.hasOnlyFormerMembers,
				)
			: undefined;
	return <MessagesCard channels={channels} />;
};
