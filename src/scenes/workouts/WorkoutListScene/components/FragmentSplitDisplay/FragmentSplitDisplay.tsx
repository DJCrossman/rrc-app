import type { AnalyticMetrics } from "@/app/api/v1/analytics/actions";
import type { WorkoutFragment } from "@/app/api/v1/workouts/actions";
import {
	formatCompactDuration,
	formatCompactSplit,
	formatMeters,
} from "@/lib/formatters";
import { calculateTargetSplit } from "@/lib/formatters/calculateTargetSplit";

interface FragmentSplitDisplayProps {
	fragment: WorkoutFragment;
	lastTwoKm?: AnalyticMetrics["lastTwoKm"];
	lastSixKm?: AnalyticMetrics["lastSixKm"];
}

export const FragmentSplitDisplay = ({
	fragment,
	lastTwoKm,
	lastSixKm,
}: FragmentSplitDisplayProps) => {
	const baseline = fragment.relativeTo === "2K" ? lastTwoKm : lastSixKm;
	const baselineDistance = fragment.relativeTo === "2K" ? 2000 : 6000;

	const relativeSplitSeconds = fragment.relativeSplit / 1000;
	const sign =
		relativeSplitSeconds >= 0 ? "+" : relativeSplitSeconds < 0 ? "−" : "";
	const relativeNotation = `${fragment.relativeTo}${sign}${relativeSplitSeconds}"`;

	const targetSplitMs = baseline?.duration
		? calculateTargetSplit(
				baseline.duration,
				baselineDistance,
				fragment.relativeSplit,
			)
		: NaN;
	const absoluteSplit = Number.isNaN(targetSplitMs)
		? null
		: `${formatCompactSplit(targetSplitMs, 500)}/500m`;

	return (
		<div className="space-y-1">
			<FragmentDetails fragment={fragment} />
			<div className="flex items-center justify-between gap-2 font-mono text-sm">
				<span className="whitespace-nowrap">{relativeNotation}</span>
				{absoluteSplit && (
					<>
						<div className="flex-1 border-b border-dotted border-muted-foreground/30" />
						<span className="whitespace-nowrap text-muted-foreground">
							{absoluteSplit}
						</span>
					</>
				)}
			</div>
		</div>
	);
};

interface FragmentDetailsProps {
	fragment: WorkoutFragment;
}

const FragmentDetails = ({ fragment }: FragmentDetailsProps) => {
	if (fragment.distance) {
		return (
			<div className="text-sm text-muted-foreground">
				R{fragment.rate} • {formatMeters(fragment.distance)}
			</div>
		);
	}

	if (fragment.elapsedTime) {
		return (
			<div className="text-sm text-muted-foreground">
				R{fragment.rate} • {formatCompactDuration(fragment.elapsedTime)}
			</div>
		);
	}

	return <div className="text-sm text-muted-foreground">R{fragment.rate}</div>;
};
