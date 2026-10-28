"use client";

import { DateTime } from "luxon";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { useDrawerContentContainer } from "@/components/ui/drawer";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { formatHtmlAsText } from "@/lib/formatters";
import type { Programs } from "@/lib/trpc/types";
import { getProgramStatus, type ProgramStatus } from "./getProgramStatus";

type Program = Programs[number];

const STATUS_BADGE: Record<
	ProgramStatus,
	{ label: string; className: string }
> = {
	active: {
		label: "Active",
		className: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
	},
	upcoming: {
		label: "Upcoming",
		className: "border-sky-500/40 text-sky-600 dark:text-sky-400",
	},
	ended: { label: "Ended", className: "text-muted-foreground" },
};

export function ProgramHoverCard({
	program,
	children,
}: {
	program: Program;
	children: React.ReactElement;
}) {
	const container = useDrawerContentContainer();
	const status = STATUS_BADGE[getProgramStatus(program)];
	const details = getProgramDetails(program);

	return (
		<HoverCard>
			<HoverCardTrigger delay={300} closeDelay={100} render={children} />
			<HoverCardContent
				container={container ?? undefined}
				side="bottom"
				align="start"
				className="w-72 space-y-3"
			>
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 space-y-0.5">
						<p className="text-sm font-medium">{program.name}</p>
						{program.organizationName && (
							<p className="text-muted-foreground text-xs">
								{program.organizationName}
							</p>
						)}
					</div>
					<Badge variant="outline" className={status.className}>
						{status.label}
					</Badge>
				</div>
				<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
					<dt className="text-muted-foreground">Dates</dt>
					<dd>{formatProgramDates(program)}</dd>
					<dt className="text-muted-foreground">Members</dt>
					<dd>{program.memberCount}</dd>
				</dl>
				{details && (
					<p className="text-muted-foreground line-clamp-6 text-xs whitespace-pre-line">
						{details}
					</p>
				)}
			</HoverCardContent>
		</HoverCard>
	);
}

function formatProgramDates({ startDate, endDate }: Program) {
	const format = (date: string) =>
		DateTime.fromISO(date, { zone: "utc" }).toLocaleString(DateTime.DATE_MED);
	if (startDate && endDate) return `${format(startDate)} – ${format(endDate)}`;
	if (startDate) return `From ${format(startDate)}`;
	if (endDate) return `Until ${format(endDate)}`;
	return "No dates";
}

function getProgramDetails({ name, description }: Program) {
	if (!description) return null;
	return formatHtmlAsText(description)
		.split("\n")
		.filter((line) => line.toLowerCase() !== name.trim().toLowerCase())
		.join("\n");
}
