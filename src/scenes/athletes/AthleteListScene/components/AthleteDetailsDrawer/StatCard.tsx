import { DateTime } from "luxon";

interface StatCardProps {
	title: string;
	stat: {
		duration: number;
		date: string;
		activityId: number;
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
		<div className="border rounded-lg p-4">
			<h3 className="font-semibold mb-2">{title}</h3>
			{stat ? (
				<div className="space-y-1">
					<div className="text-2xl font-mono font-bold">
						{formatCompactDuration(stat.duration)}
					</div>
					<div className="text-sm text-muted-foreground font-mono">
						{formatCompactSplit(stat.duration, distance)}
						<span className="text-xs">/500m</span>
					</div>
					<div className="text-sm text-muted-foreground">
						{DateTime.fromISO(stat.date).toFormat("yyyy-MM-dd")}
					</div>
				</div>
			) : (
				<div className="space-y-1">
					<div className="text-2xl font-mono font-bold">N/A</div>
					<div className="text-sm text-muted-foreground font-mono">
						{"\u00A0"}
					</div>
					<div className="text-sm text-muted-foreground">{"\u00A0"}</div>
				</div>
			)}
		</div>
	);
};
