"use client";

import { IconPencil, IconTrash } from "@tabler/icons-react";
import type { DateTime } from "luxon";
import { useMemo } from "react";
import type { Column, RenderEditCellProps } from "react-data-grid";
import {
	numberEditor,
	selectEditor,
	textEditor,
	timeEditor,
} from "@/components/bulk-upload-drawer.editors";
import { Button } from "@/components/ui/button";
import { formatActivityType } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
	IntensityCategories,
	type WorkoutActivityType,
	WorkoutActivityTypes,
} from "@/schemas";
import { intensityColorMap } from "../../ScheduleScene/utils/intensityColorMap";
import { type BulkRow, zoneMinutesTotal } from "../utils/trainingRows";

interface UseTrainingRowColumnsOptions {
	weekStart: DateTime;
	onOpenDetails: (rowId: string) => void;
	onRemoveRow: (rowId: string) => void;
}

export function useTrainingRowColumns({
	weekStart,
	onOpenDetails,
	onRemoveRow,
}: UseTrainingRowColumnsOptions): readonly Column<BulkRow>[] {
	return useMemo(() => {
		const dayEditor = ({ row, onRowChange }: RenderEditCellProps<BulkRow>) => (
			<select
				className="w-full h-full px-2 outline-none border-0 bg-transparent text-sm"
				value={row.dayIndex ?? ""}
				onChange={(e) =>
					onRowChange({ ...row, dayIndex: Number(e.target.value) }, true)
				}
			>
				{DAY_INDEXES.map((dayIndex) => (
					<option key={dayIndex} value={dayIndex}>
						{dayLabel(weekStart, dayIndex)}
					</option>
				))}
			</select>
		);

		return [
			{
				key: "dayIndex",
				name: "Day",
				width: 110,
				frozen: true,
				renderEditCell: dayEditor,
				editable: true,
				renderCell: ({ row }) =>
					row.dayIndex == null ? "" : dayLabel(weekStart, row.dayIndex),
			},
			{
				key: "time",
				name: "Time",
				width: 90,
				renderEditCell: timeEditor,
				editable: true,
				renderCell: ({ row }) => row.time ?? "",
			},
			{
				key: "activityType",
				name: "Mode",
				width: 120,
				renderEditCell: modeEditor,
				editable: true,
				renderCell: ({ row }) =>
					row.activityType ? formatActivityType(row.activityType) : "",
			},
			{
				key: "title",
				name: "Title",
				width: 180,
				renderEditCell: textEditor,
				editable: true,
				renderCell: ({ row }) => row.title ?? "",
			},
			{
				key: "description",
				name: "Description",
				minWidth: 280,
				renderEditCell: textEditor,
				editable: true,
				renderCell: ({ row }) => row.description ?? "",
			},
			{
				key: "intensityCategory",
				name: "Zone",
				width: 90,
				renderEditCell: zoneEditor,
				editable: true,
				cellClass: (row) =>
					row.intensityCategory
						? intensityColorMap[row.intensityCategory]
						: undefined,
				renderCell: ({ row }) => row.intensityCategory ?? "",
			},
			{
				key: "workoutType",
				name: "Type",
				width: 110,
				renderEditCell: workoutTypeEditor,
				editable: true,
				renderCell: ({ row }) => row.workoutType ?? "",
			},
			{
				key: "durationMin",
				name: "Mins",
				width: 90,
				renderEditCell: numberEditor,
				editable: true,
				renderCell: ({ row }) => row.durationMin ?? "",
			},
			{
				key: "distanceMeters",
				name: "Metres",
				width: 100,
				renderEditCell: numberEditor,
				editable: true,
				renderCell: ({ row }) => row.distanceMeters ?? "",
			},
			{
				key: "intervalCount",
				name: "Intervals",
				width: 90,
				renderEditCell: numberEditor,
				editable: true,
				renderCell: ({ row }) => row.intervalCount ?? "",
			},
			...COMPOSITION_ZONES.map(
				(zone): Column<BulkRow> => ({
					key: `zone${zone}`,
					name: zone,
					width: 64,
					renderEditCell: numberEditor,
					editable: true,
					cellClass: intensityColorMap[zone],
					renderCell: ({ row }) => row[`zone${zone}` as const] ?? "",
				}),
			),
			{
				key: "__compositionTotal",
				name: "Total",
				width: 72,
				// Mirrors the sheet's TOTAL column: composition should account for the
				// whole session, so a mismatch is called out rather than silently kept.
				renderCell: ({ row }) => {
					const total = zoneMinutesTotal(row);
					if (!total) return "";
					const matchesDuration =
						row.durationMin == null || total === row.durationMin;
					return (
						<span
							className={cn(
								"tabular-nums",
								!matchesDuration && "font-medium text-destructive",
							)}
							title={
								matchesDuration
									? undefined
									: `Composition is ${total} min but the session is ${row.durationMin} min`
							}
						>
							{total}
						</span>
					);
				},
			},
			{
				key: "__actions",
				name: "",
				width: 84,
				renderCell: ({ row }) => (
					<div className="flex items-center gap-0.5">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							title="Open in event form"
							onClick={() => onOpenDetails(row.__id)}
						>
							<IconPencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-muted-foreground hover:text-destructive"
							title="Remove this row"
							onClick={() => onRemoveRow(row.__id)}
						>
							<IconTrash className="h-4 w-4" />
						</Button>
					</div>
				),
			},
		];
	}, [weekStart, onOpenDetails, onRemoveRow]);
}

// Columns whose editor is a dropdown: clicking one opens the editor straight
// away, so picking a value takes two clicks instead of select-then-open-then-pick.
export const SELECT_COLUMN_KEYS = new Set([
	"dayIndex",
	"activityType",
	"intensityCategory",
	"workoutType",
]);

function dayLabel(weekStart: DateTime, dayIndex: number) {
	return weekStart.startOf("day").plus({ days: dayIndex }).toFormat("EEE d");
}

const DAY_INDEXES = [0, 1, 2, 3, 4, 5, 6];

// Easiest first, matching the order the coach reads across their sheet.
const COMPOSITION_ZONES = [...IntensityCategories].reverse();

const modeEditor = selectEditor<BulkRow>([...WorkoutActivityTypes], (option) =>
	formatActivityType(option as WorkoutActivityType),
);

const zoneEditor = selectEditor<BulkRow>([...IntensityCategories]);

const workoutTypeEditor = selectEditor<BulkRow>(["time", "distance", "other"]);
