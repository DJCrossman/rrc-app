"use client";

import type { DateTime } from "luxon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatActivityType, formatDistance } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
	IntensityCategories,
	type IntensityCategory,
	type WorkoutActivityType,
	WorkoutActivityTypes,
} from "@/schemas";
import { intensityColorMap } from "../../ScheduleScene/utils/intensityColorMap";
import { toPercent, type WeekTotals } from "../utils/computeWeekTotals";

interface WeekTotalsPanelProps {
	totals: WeekTotals;
	weekStart: DateTime;
}

export function WeekTotalsPanel({ totals, weekStart }: WeekTotalsPanelProps) {
	const { total } = totals;

	return (
		<aside className="flex w-full shrink-0 flex-col gap-4 xl:w-80 xl:min-h-0 xl:overflow-y-auto">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Weekly volume
					</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-3 gap-2">
					<Stat label="Hours" value={formatHours(total.minutes)} />
					<Stat label="Distance" value={formatDistance(total.meters)} />
					<Stat label="Sessions" value={String(totals.sessionCount)} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Weekly training
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<StackedBar
						segments={WorkoutActivityTypes.map((mode) => ({
							key: mode,
							percent: toPercent(totals.byMode[mode].minutes, total.minutes),
							className: modeBarColor[mode],
						}))}
					/>
					<div className="space-y-1">
						{WorkoutActivityTypes.map((mode) => (
							<SplitRow
								key={mode}
								label={formatActivityType(mode)}
								swatch={modeBarColor[mode]}
								minutes={totals.byMode[mode].minutes}
								meters={totals.byMode[mode].meters}
								percent={toPercent(totals.byMode[mode].minutes, total.minutes)}
							/>
						))}
					</div>
					<div className="flex items-center justify-between border-t pt-2 text-sm">
						<span className="text-muted-foreground">Total</span>
						<span className="tabular-nums">
							{total.minutes} min · {formatHours(total.minutes)} h
						</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Session composition
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<StackedBar
						segments={COMPOSITION_ZONES.map((zone) => ({
							key: zone,
							percent: toPercent(
								totals.byZone[zone].minutes,
								totals.composedMinutes,
							),
							className: zoneBarColor[zone],
						}))}
					/>
					<div className="space-y-1">
						{COMPOSITION_ZONES.map((zone) => (
							<SplitRow
								key={zone}
								label={zone}
								labelClassName={cn(
									"rounded px-1.5 py-0.5 text-xs",
									intensityColorMap[zone],
								)}
								minutes={totals.byZone[zone].minutes}
								meters={totals.byZone[zone].meters}
								percent={toPercent(
									totals.byZone[zone].minutes,
									totals.composedMinutes,
								)}
							/>
						))}
					</div>
					<div className="space-y-1 border-t pt-2 text-sm">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Total in zone</span>
							<span className="tabular-nums">{totals.composedMinutes} min</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Low intensity (C6)</span>
							<span className="tabular-nums">
								{toPercent(
									totals.byZone.C6.minutes,
									totals.composedMinutes,
								).toFixed(1)}
								%
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Daily volume
					</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-7 gap-1">
					{totals.byDay.map((day, index) => (
						<div
							key={weekStart.plus({ days: index }).toISODate()}
							className="rounded-md bg-muted/40 px-1 py-2 text-center"
						>
							<div className="text-[10px] uppercase text-muted-foreground">
								{weekStart.plus({ days: index }).toFormat("ccc")}
							</div>
							<div className="text-xs font-medium tabular-nums">
								{day.minutes ? formatHours(day.minutes) : "—"}
							</div>
							<div className="text-[10px] text-muted-foreground tabular-nums">
								{day.meters ? formatDistance(day.meters) : ""}
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</aside>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className="text-xs text-muted-foreground">{label}</div>
			<div className="text-xl font-semibold tabular-nums">{value}</div>
		</div>
	);
}

function StackedBar({
	segments,
}: {
	segments: { key: string; percent: number; className: string }[];
}) {
	const visible = segments.filter((segment) => segment.percent > 0);
	return (
		<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
			{visible.map((segment) => (
				<div
					key={segment.key}
					className={segment.className}
					style={{ width: `${segment.percent}%` }}
				/>
			))}
		</div>
	);
}

function SplitRow({
	label,
	labelClassName,
	swatch,
	minutes,
	meters,
	percent,
}: {
	label: string;
	labelClassName?: string;
	swatch?: string;
	minutes: number;
	meters: number;
	percent: number;
}) {
	return (
		<div className="flex items-center justify-between gap-2 text-sm">
			<span className="flex items-center gap-2">
				{swatch ? (
					<span className={cn("h-2 w-2 rounded-full", swatch)} />
				) : null}
				<span className={labelClassName}>{label}</span>
			</span>
			<span className="flex items-center gap-2 tabular-nums text-muted-foreground">
				<span>{minutes ? `${minutes}m` : "—"}</span>
				<span>{meters ? formatDistance(meters) : ""}</span>
				<span className="w-10 text-right">
					{percent ? `${percent.toFixed(0)}%` : ""}
				</span>
			</span>
		</div>
	);
}

function formatHours(minutes: number) {
	if (!minutes) return "0:00";
	const hours = Math.floor(minutes / 60);
	const remainder = Math.round(minutes % 60);
	return `${hours}:${String(remainder).padStart(2, "0")}`;
}

// Easiest first, matching the order the coach reads across their sheet.
const COMPOSITION_ZONES = [...IntensityCategories].reverse();

const modeBarColor = {
	water: "bg-sky-500",
	erg: "bg-violet-500",
	crossTrain: "bg-teal-500",
	strength: "bg-amber-500",
} satisfies Record<WorkoutActivityType, string>;

const zoneBarColor = {
	C1: "bg-intensity-100",
	C2: "bg-intensity-200",
	C3: "bg-intensity-300",
	C4: "bg-intensity-400",
	C5: "bg-intensity-500",
	C6: "bg-intensity-600",
} satisfies Record<IntensityCategory, string>;
