import { DateTime } from "luxon";
import type React from "react";
import type { ScheduleDay } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";

interface DayRowProps {
	day: ScheduleDay;
	isSelected: boolean;
	children: React.ReactNode;
}

export const DayRow = ({ day, isSelected, children }: DayRowProps) => {
	const date = DateTime.fromISO(day.date);
	return (
		<section
			aria-label={date.toFormat("cccc, LLLL d", { locale: "en-US" })}
			className={cn(
				"flex gap-4 border-b py-4 last:border-b-0",
				!isSelected && "max-md:hidden",
			)}
		>
			<div className="hidden w-14 shrink-0 flex-col items-center gap-1 md:flex">
				<span className="text-xs font-medium text-muted-foreground uppercase">
					{date.toFormat("ccc", { locale: "en-US" })}
				</span>
				<span
					className={cn(
						"flex size-9 items-center justify-center rounded-full text-lg font-semibold",
						day.isToday && "bg-primary text-primary-foreground",
					)}
				>
					{date.day}
				</span>
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-2">
				{day.events.length > 0 ? (
					children
				) : (
					<p className="py-2 text-sm text-muted-foreground">
						Nothing scheduled
					</p>
				)}
			</div>
		</section>
	);
};
