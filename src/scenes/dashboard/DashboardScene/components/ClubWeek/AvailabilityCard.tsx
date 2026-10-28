import { IconBell } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEventDay } from "@/lib/schedule/event-labels";
import { withErrorToast } from "@/lib/toast";
import { trpcClient } from "@/lib/trpc/client";
import type { ScheduleEvent } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { NudgeDialog } from "@/scenes/schedule/ScheduleScene/components";
import { formatNudgeResult } from "@/scenes/schedule/ScheduleScene/utils/formatNudgeResult";
import { ClubWeekCard } from "./ClubWeekCard";

const STATS = [
	{ key: "going", label: "Going", dot: "bg-intensity-600" },
	{ key: "maybe", label: "Maybe", dot: "bg-intensity-400" },
	{ key: "no", label: "Can't", dot: "bg-intensity-100" },
	{ key: "noReply", label: "No reply", dot: "bg-muted-foreground" },
] as const;

interface AvailabilityCardProps {
	event: ScheduleEvent | null | undefined;
	today: string;
	isAdmin: boolean;
	responsesHref: (eventId: string) => string;
}

export const AvailabilityCard = ({
	event,
	today,
	isAdmin,
	responsesHref,
}: AvailabilityCardProps) => {
	const [isNudging, setIsNudging] = useState(false);
	const nudge = trpcClient.schedule.nudge.useMutation();
	const responsesQuery = trpcClient.schedule.getResponses.useQuery(
		{ eventId: event?.id ?? "" },
		{ enabled: !!event?.counts.noReply },
	);
	const noReplyNames = (responsesQuery.data?.noReply ?? [])
		.map((person) => person.name.split(" ")[0])
		.join(", ");

	if (event === undefined) {
		return (
			<ClubWeekCard title="Availability">
				<Skeleton className="h-24 w-full" />
			</ClubWeekCard>
		);
	}
	if (!event) {
		return (
			<ClubWeekCard title="Availability">
				<p className="text-[13px] text-muted-foreground">
					No upcoming training.
				</p>
			</ClubWeekCard>
		);
	}

	return (
		<ClubWeekCard
			title={
				<span className="flex flex-col gap-0.5">
					Availability
					<span className="text-[13px] font-normal text-foreground">
						{event.title} · {formatEventDay(event.date, today)} ·{" "}
						{event.timeLabel}
					</span>
				</span>
			}
			action={
				isAdmin && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-xs"
						onClick={() => setIsNudging(true)}
					>
						<IconBell />
						Nudge
					</Button>
				)
			}
		>
			<div className="grid grid-cols-4 gap-1.5">
				{STATS.map(({ key, label, dot }) => (
					<div
						key={key}
						className="flex flex-col rounded-lg border bg-background px-2 py-1.5 text-xs"
					>
						<span className="text-[17px] font-semibold tabular-nums">
							{event.counts[key]}
						</span>
						<span className="flex items-center gap-1.5 text-muted-foreground">
							<span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
							<span className="truncate">{label}</span>
						</span>
					</div>
				))}
			</div>
			{noReplyNames && (
				<p className="text-[13px] text-pretty text-muted-foreground">
					No reply yet: <span className="text-foreground">{noReplyNames}</span>
				</p>
			)}
			{isAdmin && (
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					render={<Link href={responsesHref(event.id)} />}
				>
					See all responses
				</Button>
			)}
			{isNudging && (
				<NudgeDialog
					event={event}
					onClose={() => setIsNudging(false)}
					onConfirm={async (eventId) => {
						const { count, reached } = await withErrorToast(
							nudge.mutateAsync({ eventId }),
						);
						toast.success(formatNudgeResult(count, reached));
					}}
				/>
			)}
		</ClubWeekCard>
	);
};
