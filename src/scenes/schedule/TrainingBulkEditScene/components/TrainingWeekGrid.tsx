"use client";

import { IconAlertCircle, IconPlus } from "@tabler/icons-react";
import type { DateTime } from "luxon";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Column,
	DataGrid,
	type DataGridHandle,
	SelectColumn,
} from "react-data-grid";
import "react-data-grid/lib/styles.css";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BulkRow } from "../utils/trainingRows";
import {
	SELECT_COLUMN_KEYS,
	useTrainingRowColumns,
} from "./useTrainingRowColumns";

interface TrainingWeekGridProps {
	rows: BulkRow[];
	rowErrors: Record<string, z.ZodError>;
	weekStart: DateTime;
	selectedRows: ReadonlySet<string>;
	isSaving: boolean;
	onRowsChange: (rows: BulkRow[]) => void;
	onSelectedRowsChange: (selectedRows: Set<string>) => void;
	onAddRow: () => void;
	onOpenDetails: (rowId: string) => void;
	onRemoveRow: (rowId: string) => void;
}

export const TrainingWeekGrid = ({
	rows,
	rowErrors,
	weekStart,
	selectedRows,
	isSaving,
	onRowsChange,
	onSelectedRowsChange,
	onAddRow,
	onOpenDetails,
	onRemoveRow,
}: TrainingWeekGridProps) => {
	const gridRef = useRef<DataGridHandle>(null);
	const [hasMoreToScroll, setHasMoreToScroll] = useState(false);
	const hasRows = rows.length > 0;

	// The composition columns sit off the right edge on most screens. Tracking
	// how far the grid is scrolled lets the fades appear only on the side that
	// actually has more to show.
	useEffect(() => {
		const element = hasRows ? gridRef.current?.element : null;
		if (!element) {
			setHasMoreToScroll(false);
			return;
		}
		const update = () => {
			const maxScroll = element.scrollWidth - element.clientWidth;
			setHasMoreToScroll(
				maxScroll > SCROLL_EDGE_TOLERANCE &&
					element.scrollLeft < maxScroll - SCROLL_EDGE_TOLERANCE,
			);
		};
		update();
		element.addEventListener("scroll", update, { passive: true });
		const observer = new ResizeObserver(update);
		observer.observe(element);
		return () => {
			element.removeEventListener("scroll", update);
			observer.disconnect();
		};
	}, [hasRows]);

	const columns = useTrainingRowColumns({
		weekStart,
		onOpenDetails,
		onRemoveRow,
	});

	const wrappedColumns = useMemo<Column<BulkRow>[]>(() => {
		const statusColumn: Column<BulkRow> = {
			key: "__status",
			name: "",
			width: 56,
			minWidth: 56,
			frozen: true,
			renderCell: ({ row, rowIdx }) => {
				const error = rowErrors[row.__id];
				return (
					<div className="flex items-center gap-1">
						<span className="text-xs text-muted-foreground">{rowIdx + 1}</span>
						{error ? (
							<span
								title={error.issues
									.map(
										(issue) =>
											`${issue.path.join(".") || "row"}: ${issue.message}`,
									)
									.join("\n")}
							>
								<IconAlertCircle className="h-4 w-4 text-destructive" />
							</span>
						) : null}
					</div>
				);
			},
		};

		const userColumns = (columns as unknown as readonly Column<BulkRow>[]).map(
			(col): Column<BulkRow> => {
				const baseCellClass = col.cellClass;
				return {
					...col,
					cellClass: (row) => {
						const error = rowErrors[row.__id];
						const fieldHasError = error?.issues.some(
							(issue) => issue.path[0] === col.key,
						);
						const baseClass =
							typeof baseCellClass === "function"
								? baseCellClass(row)
								: baseCellClass;
						return cn(
							baseClass,
							fieldHasError && "ring-2 ring-destructive ring-inset",
						);
					},
				};
			},
		);

		return [SelectColumn as Column<BulkRow>, statusColumn, ...userColumns];
	}, [columns, rowErrors]);

	return (
		<div
			className={cn(
				// min-w-0 is load-bearing: without it the flex item refuses to
				// shrink below the grid's full column width and shoves the
				// totals rail off the edge. The grid scrolls sideways instead.
				"min-h-[32rem] min-w-0 flex-1 xl:min-h-0",
				// Edits made while a save is in flight would be discarded by the
				// re-seed that follows it, so the grid is locked until it lands.
				isSaving && "pointer-events-none opacity-60",
			)}
			aria-busy={isSaving}
		>
			{hasRows ? (
				<div className="relative h-full">
					<DataGrid
						ref={gridRef}
						className={cn("rdg-dark h-full", GRID_SCROLLBARS)}
						style={GRID_THEME}
						columns={wrappedColumns}
						rows={rows}
						onRowsChange={onRowsChange}
						rowKeyGetter={(row) => row.__id}
						selectedRows={selectedRows}
						onSelectedRowsChange={onSelectedRowsChange}
						onCellClick={({ column, selectCell }) => {
							if (SELECT_COLUMN_KEYS.has(column.key)) selectCell(true);
						}}
						onFill={({ columnKey, sourceRow, targetRow }) => ({
							...targetRow,
							[columnKey]: (sourceRow as Record<string, unknown>)[columnKey],
						})}
					/>
					{/* Only the right edge gets a fade. A left one would sit on top
					    of the frozen Day columns and wash them out; the grid already
					    shadows that boundary itself. */}
					<div
						aria-hidden
						className={cn(
							"pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-150",
							hasMoreToScroll ? "opacity-100" : "opacity-0",
						)}
					/>
				</div>
			) : (
				<div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
					<p className="text-sm text-muted-foreground">
						No training sessions planned for this week.
					</p>
					<p className="text-sm text-muted-foreground">
						Add a row, or paste rows straight from a spreadsheet.
					</p>
					<Button variant="outline" size="sm" onClick={onAddRow}>
						<IconPlus />
						Add row
					</Button>
				</div>
			)}
		</div>
	);
};

// macOS hides overlay scrollbars until something moves, which leaves the grid
// looking like it simply ends at the last visible column. Painting the
// scrollbar opts out of that and keeps it on screen.
const GRID_SCROLLBARS = cn(
	"[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5",
	"[&::-webkit-scrollbar-track]:bg-transparent",
	"[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40",
	"[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/70",
	"[&::-webkit-scrollbar-corner]:bg-transparent",
	"[scrollbar-color:var(--color-muted-foreground)_transparent]",
);

const SCROLL_EDGE_TOLERANCE = 2;

// react-data-grid paints its rows with light-dark(), which Next compiles through
// Lightning CSS into a --lightningcss-* polyfill. rdg sets color-scheme from a
// variable, so those helper vars are never defined, the declaration is invalid
// and the row background drops to transparent — which lets scrolled columns show
// straight through the frozen ones. Pointing rdg at the app's own tokens skips
// the polyfill and gives the frozen columns something opaque to sit on.
// These are the raw theme tokens, not the `--color-*` aliases: `@theme inline`
// folds those into utility classes and never emits them as custom properties, so
// referencing them here would be just as invalid as the polyfill we're replacing.
const GRID_THEME = {
	"--rdg-background-color": "var(--background)",
	"--rdg-header-background-color": "var(--card)",
	"--rdg-row-hover-background-color": "var(--muted)",
	"--rdg-row-selected-background-color": "var(--accent)",
	"--rdg-row-selected-hover-background-color": "var(--accent)",
	"--rdg-color": "var(--foreground)",
	"--rdg-border-color": "var(--border)",
	"--rdg-summary-border-color": "var(--border)",
} as React.CSSProperties;
