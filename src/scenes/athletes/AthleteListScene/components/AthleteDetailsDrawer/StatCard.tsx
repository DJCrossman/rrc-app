import { DateTime } from "luxon";

interface StatCardProps {
	title: string;
	stat: {
		duration: number;
		date: string;
		activityId: string;
	} | null;
	distance: number;
}

const formatCompactDuration = (durationInMs: number): string => {
	const totalSeconds = durationInMs / 1000;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const secondsFormatted = seconds.toFixed(1).padStart(4, "0");
	return `${minutes.toString().padStart(2, "0")}:${secondsFormatted}`;
};

const formatCompactSplit = (
	durationMs: number,
	distanceMeters: number,
): string => {
	const splitMs = (durationMs / distanceMeters) * 500;
	const totalSeconds = splitMs / 1000;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const secondsFormatted = seconds.toFixed(1).padStart(4, "0");
	return `${minutes}:${secondsFormatted}`;
};

export const StatCard = ({ title, stat, distance }: StatCardProps) => {
	return (
		<div className="flex flex-col gap-1 rounded-xl border bg-background px-3.5 py-3">
			<span className="text-[13px] text-muted-foreground">{title}</span>
			{stat ? (
				<>
					<span className="text-[17px] font-semibold tabular-nums">
						{formatCompactDuration(stat.duration)}
					</span>
					<span className="text-xs text-muted-foreground tabular-nums">
						{formatCompactSplit(stat.duration, distance)}/500m ·{" "}
						{DateTime.fromISO(stat.date).toFormat("MMM d, yyyy")}
					</span>
				</>
			) : (
				<span className="text-[17px] font-semibold text-muted-foreground">
					—
				</span>
			)}
		</div>
	);
};
