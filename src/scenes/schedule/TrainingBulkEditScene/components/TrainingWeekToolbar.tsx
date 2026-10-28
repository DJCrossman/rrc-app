"use client";

import {
	IconChevronLeft,
	IconChevronRight,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import type { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { routes } from "@/lib/routes";
import { formatWeekRange } from "@/lib/schedule/week";

interface TrainingWeekToolbarProps {
	weekStart: DateTime;
	invalidRowCount: number;
	isDirty: boolean;
	selectedCount: number;
	isSaving: boolean;
	onChangeWeek: (weekStart: DateTime) => void;
	onAddRow: () => void;
	onRemoveSelected: () => void;
	onSave: () => void;
}

export const TrainingWeekToolbar = ({
	weekStart,
	invalidRowCount,
	isDirty,
	selectedCount,
	isSaving,
	onChangeWeek,
	onAddRow,
	onRemoveSelected,
	onSave,
}: TrainingWeekToolbarProps) => (
	<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 p-4 lg:px-6">
		<div className="flex items-center gap-3">
			<Heading as="h1">Bulk edit training</Heading>
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					onClick={() => onChangeWeek(weekStart.minus({ weeks: 1 }))}
					aria-label="Previous week"
				>
					<IconChevronLeft />
				</Button>
				<span className="min-w-40 text-center text-sm text-muted-foreground">
					{formatWeekRange(weekStart)}
				</span>
				<Button
					variant="outline"
					size="icon"
					onClick={() => onChangeWeek(weekStart.plus({ weeks: 1 }))}
					aria-label="Next week"
				>
					<IconChevronRight />
				</Button>
			</div>
		</div>
		<div className="flex items-center gap-2">
			{invalidRowCount > 0 ? (
				<span className="text-sm text-destructive">
					{invalidRowCount} incomplete {invalidRowCount === 1 ? "row" : "rows"}
				</span>
			) : isDirty ? (
				<span className="text-sm text-muted-foreground">Unsaved changes</span>
			) : null}
			<Button variant="outline" size="sm" onClick={onAddRow}>
				<IconPlus />
				Add row
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={onRemoveSelected}
				disabled={selectedCount === 0}
			>
				<IconTrash />
				Remove ({selectedCount})
			</Button>
			<Button size="sm" onClick={onSave} disabled={!isDirty || isSaving}>
				{isSaving ? "Saving..." : "Save week"}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				render={<a href={routes.schedule.list({ week: weekStart })}>Done</a>}
			/>
		</div>
	</div>
);
