import { IconCircleCheck } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEventDay } from "@/lib/schedule/event-labels";
import type { ScheduleEvent } from "@/lib/trpc/types";
import { RsvpButtons } from "@/scenes/schedule/ScheduleScene/components/RsvpButtons/RsvpButtons";
import type { RsvpStatus } from "@/schemas";
import { ClubWeekCard, CountBadge } from "./ClubWeekCard";

interface NeedsReplyCardProps {
	events: ScheduleEvent[] | undefined;
	today: string;
	onRsvp: (eventId: string, status: RsvpStatus) => Promise<RsvpStatus | null>;
}

export const NeedsReplyCard = ({
	events,
	today,
	onRsvp,
}: NeedsReplyCardProps) => (
	<ClubWeekCard
		className="gap-1"
		title={
			<>
				Needs your reply
				{!!events?.length && <CountBadge count={events.length} />}
			</>
		}
	>
		<PendingEvents events={events} today={today} onRsvp={onRsvp} />
	</ClubWeekCard>
);

const PendingEvents = ({ events, today, onRsvp }: NeedsReplyCardProps) => {
	if (!events) {
		return <Skeleton className="h-16 w-full" />;
	}
	if (events.length === 0) {
		return (
			<p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
				<IconCircleCheck className="size-4 text-intensity-600" />
				You're all caught up.
			</p>
		);
	}
	return (
		<ul className="flex flex-col">
			{events.map((event) => (
				<li
					key={event.id}
					className="flex items-center gap-2.5 border-t border-border/60 py-1.5"
				>
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="truncate text-[13px] font-medium">
							{event.title}
						</span>
						<span className="truncate text-xs text-muted-foreground">
							{formatEventDay(event.date, today)} · {event.timeLabel}
						</span>
					</div>
					<RsvpButtons
						eventId={event.id}
						status={event.myRsvp}
						onRsvp={onRsvp}
					/>
				</li>
			))}
		</ul>
	);
};
