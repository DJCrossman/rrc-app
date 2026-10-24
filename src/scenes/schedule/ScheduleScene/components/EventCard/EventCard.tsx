import {
	IconBarbell,
	IconBell,
	IconDotsVertical,
	IconEye,
	IconMapPin,
	IconUsersGroup,
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMapsSearchUrl } from "@/lib/maps";
import type { ScheduleEvent } from "@/lib/trpc/types";
import type { RsvpStatus } from "@/schemas";
import { EventTypeBadge } from "../EventTypeBadge/EventTypeBadge";
import { RsvpButtons } from "../RsvpButtons/RsvpButtons";
import { VolunteerSignup } from "../VolunteerSignup/VolunteerSignup";

interface EventCardProps {
	event: ScheduleEvent;
	isAdmin: boolean;
	viewHref: string;
	onRsvp: (eventId: string, status: RsvpStatus) => Promise<RsvpStatus | null>;
	onNudge: (event: ScheduleEvent) => void;
}

export const EventCard = ({
	event,
	isAdmin,
	viewHref,
	onRsvp,
	onNudge,
}: EventCardProps) => (
	<div className="flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-center md:gap-4">
		<div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:gap-4">
			<span className="shrink-0 text-sm font-medium text-muted-foreground tabular-nums md:w-32 md:pt-0.5">
				{event.timeLabel}
			</span>
			<div className="flex min-w-0 flex-col gap-1">
				<div className="flex flex-wrap items-center gap-2">
					<Link
						href={viewHref}
						scroll={false}
						className="font-semibold hover:underline"
					>
						{event.title}
					</Link>
					<EventTypeBadge type={event.type} label={event.typeLabel} />
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
					{event.workout && (
						<span className="flex items-center gap-1.5">
							<IconBarbell className="size-4 shrink-0" />
							{event.workout.description
								.split(";")
								.map((part) => part.trim())
								.filter(Boolean)
								.join(" · ")}
						</span>
					)}
					{event.location && (
						<a
							href={getMapsSearchUrl(event.location)}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-1.5 hover:text-foreground hover:underline"
						>
							<IconMapPin className="size-4 shrink-0" />
							{event.location}
						</a>
					)}
					<span className="flex items-center gap-1.5">
						<IconUsersGroup className="size-4 shrink-0" />
						{event.groupLabel}
					</span>
				</div>
			</div>
		</div>
		<div className="flex items-center gap-4">
			{event.volunteer ? (
				<VolunteerSignup
					key={`${event.volunteer.filled}:${event.volunteer.signedUp}`}
					eventId={event.id}
					filled={event.volunteer.filled}
					spots={event.volunteer.spots}
					signedUp={event.volunteer.signedUp}
					canSignUp={event.canRsvp}
					onRsvp={onRsvp}
				/>
			) : (
				event.canRsvp && (
					<RsvpButtons
						key={event.myRsvp ?? "none"}
						eventId={event.id}
						status={event.myRsvp}
						onRsvp={onRsvp}
					/>
				)
			)}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Event actions"
						className="ml-auto"
					>
						<IconDotsVertical />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem asChild>
						<Link href={viewHref} scroll={false}>
							<IconEye />
							View details
						</Link>
					</DropdownMenuItem>
					{isAdmin && (
						<DropdownMenuItem onSelect={() => onNudge(event)}>
							<IconBell />
							Nudge athletes
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</div>
);
