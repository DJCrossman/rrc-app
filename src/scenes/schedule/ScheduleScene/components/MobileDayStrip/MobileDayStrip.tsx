import { DateTime } from "luxon";
import type { ScheduleDay } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";

interface MobileDayStripProps {
	days: ScheduleDay[];
	selectedDate: string;
	onSelect: (date: string) => void;
}

export const MobileDayStrip = ({
	days,
	selectedDate,
	onSelect,
}: MobileDayStripProps) => (
	<div className="grid grid-cols-7 gap-1 md:hidden">
		{days.map((day) => {
			const date = DateTime.fromISO(day.date);
			const isSelected = day.date === selectedDate;
			return (
				<button
					key={day.date}
					type="button"
					aria-pressed={isSelected}
					onClick={() => onSelect(day.date)}
					className={cn(
						"flex flex-col items-center gap-1 rounded-lg py-2",
						isSelected ? "bg-accent" : "hover:bg-accent/50",
					)}
				>
					<span className="text-xs font-medium text-muted-foreground uppercase">
						{date.toFormat("ccc", { locale: "en-US" })}
					</span>
					<span
						className={cn(
							"flex size-8 items-center justify-center rounded-full text-sm font-semibold",
							day.isToday && "bg-primary text-primary-foreground",
						)}
					>
						{date.day}
					</span>
					<span
						className={cn(
							"size-1.5 rounded-full",
							day.events.length > 0 ? "bg-foreground/70" : "bg-transparent",
						)}
					/>
				</button>
			);
		})}
	</div>
);
