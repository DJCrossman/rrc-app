import { IconBarbell, IconMapPin } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEventDay } from "@/lib/schedule/event-labels";
import type { ScheduleEvent } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { RsvpButtons } from "@/scenes/schedule/ScheduleScene/components/RsvpButtons/RsvpButtons";
import type { RsvpStatus } from "@/schemas";
import { ClubWeekCard } from "./ClubWeekCard";
import { EVENT_TYPE_DOT } from "./eventTypeDot";

const LATER_COUNT = 3;

interface UpNextCardProps {
	events: ScheduleEvent[] | undefined;
	today: string;
	scheduleHref: string;
	onRsvp: (eventId: string, status: RsvpStatus) => Promise<RsvpStatus | null>;
}

export const UpNextCard = ({
	events,
	today,
	scheduleHref,
	onRsvp,
}: UpNextCardProps) => {
	const [next, ...later] = events ?? [];
	return (
		<ClubWeekCard
			title="Up next"
			action={
				<Button asChild variant="outline" size="sm" className="h-7 text-xs">
					<Link href={scheduleHref}>Full schedule</Link>
				</Button>
			}
		>
			{!events ? (
				<Skeleton className="h-24 w-full" />
			) : !next ? (
				<p className="text-sm text-muted-foreground">Nothing coming up.</p>
			) : (
				<>
					<div className="flex flex-col gap-1">
						<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<span
								className={cn(
									"size-1.5 rounded-full",
									EVENT_TYPE_DOT[next.type],
								)}
							/>
							{next.typeLabel} · {formatEventDay(next.date, today)} ·{" "}
							{next.timeLabel}
						</span>
						<span className="text-[17px] font-semibold tracking-tight">
							{next.title}
						</span>
						{(next.location || next.workout) && (
							<span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
								{next.location && (
									<span className="flex items-center gap-1">
										<IconMapPin className="size-3.5" />
										{next.location}
									</span>
								)}
								{next.workout && (
									<span className="flex items-center gap-1 text-foreground/80">
										<IconBarbell className="size-3.5" />
										{next.workout.description
											.split(";")
											.map((part) => part.trim())
											.filter(Boolean)
											.join(" · ")}
									</span>
								)}
							</span>
						)}
						{next.canRsvp && next.type !== "volunteer" && (
							<div className="mt-1">
								<RsvpButtons
									key={next.id}
									eventId={next.id}
									status={next.myRsvp}
									showLabels
									onRsvp={onRsvp}
								/>
							</div>
						)}
					</div>
					{later.length > 0 && (
						<ul className="flex flex-col border-t">
							{later.slice(0, LATER_COUNT).map((event) => (
								<li
									key={event.id}
									className="flex min-h-8 items-center gap-2.5 border-b border-border/60 last:border-b-0"
								>
									<span
										className={cn(
											"size-1.5 shrink-0 rounded-full",
											EVENT_TYPE_DOT[event.type],
										)}
									/>
									<span className="min-w-0 flex-1 truncate text-[13px]">
										{event.title}
									</span>
									<span className="text-xs whitespace-nowrap text-muted-foreground">
										{formatEventDay(event.date, today, "short")} ·{" "}
										{event.timeLabel}
									</span>
								</li>
							))}
						</ul>
					)}
				</>
			)}
		</ClubWeekCard>
	);
};
