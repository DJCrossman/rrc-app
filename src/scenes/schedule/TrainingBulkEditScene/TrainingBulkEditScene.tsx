"use client";

import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { z } from "zod";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import { CLUB_TIMEZONE } from "@/lib/schedule/week";
import { trpcClient } from "@/lib/trpc/client";
import type { ScheduleWeek } from "@/lib/trpc/types";
import { type TrainingRow, trainingRowSchema } from "@/schemas";
import { SaveWeekDialog } from "./components/SaveWeekDialog";
import { TrainingRowDrawers } from "./components/TrainingRowDrawers";
import { TrainingWeekGrid } from "./components/TrainingWeekGrid";
import { TrainingWeekToolbar } from "./components/TrainingWeekToolbar";
import { WeekTotalsPanel } from "./components/WeekTotalsPanel";
import { computeWeekTotals } from "./utils/computeWeekTotals";
import {
	isDelimitedRows,
	isTextEntryTarget,
	parseDelimitedRows,
} from "./utils/pasteRows";
import {
	type BulkRow,
	computeSaveImpact,
	computeTrainingDiff,
	createEmptyTrainingRow,
	followAutoTitle,
	type SaveImpact,
	selectTrainingEvents,
	stripInternal,
	toBulkRow,
} from "./utils/trainingRows";

interface TrainingBulkEditSceneProps {
	week: ScheduleWeek;
}

export const TrainingBulkEditScene = ({ week }: TrainingBulkEditSceneProps) => {
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const currentWeekIsoDate = week.weekStart;
	const weekStart = useMemo(
		() => DateTime.fromISO(currentWeekIsoDate, { zone: CLUB_TIMEZONE }),
		[currentWeekIsoDate],
	);

	if (!weekStart.isValid) {
		throw new Error("Invalid week date");
	}

	const baseline = useMemo(
		() =>
			selectTrainingEvents(week.days).sort((a, b) =>
				a.startAt.localeCompare(b.startAt),
			),
		[week.days],
	);
	const [rows, setRows] = useState<BulkRow[]>(() =>
		baseline.map((event) => toBulkRow(event, weekStart)),
	);
	const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
		new Set(),
	);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [pendingImpact, setPendingImpact] = useState<SaveImpact | null>(null);
	const [notify, setNotify] = useState(true);
	const [editingRowId, setEditingRowId] = useState<string | null>(null);
	const isDirtyRef = useRef(false);
	const seededWeekRef = useRef(currentWeekIsoDate);
	const awaitingSavedDataRef = useRef(false);

	const saveTrainingWeek = trpcClient.schedule.saveTrainingWeek.useMutation({
		onSuccess: async () => {
			awaitingSavedDataRef.current = true;
			setPendingImpact(null);
			await utils.schedule.getWeek.invalidate();
			router.refresh();
		},
		onError: (error) => {
			setPendingImpact(null);
			setSaveError(error.message);
		},
	});

	// Validation is derived, not stashed on save, so a bad cell is flagged the
	// moment it is typed and the coach can see why a row is missing from totals.
	const { parsedRows, rowErrors } = useMemo(() => {
		const parsed: TrainingRow[] = [];
		const errors: Record<string, z.ZodError> = {};
		for (const row of rows) {
			const result = trainingRowSchema.safeParse(stripInternal(row));
			if (result.success) {
				parsed.push(result.data);
			} else {
				errors[row.__id] = result.error;
			}
		}
		return { parsedRows: parsed, rowErrors: errors };
	}, [rows]);
	const invalidRowCount = Object.keys(rowErrors).length;
	const totals = useMemo(() => computeWeekTotals(parsedRows), [parsedRows]);

	const diff = useMemo(
		() => computeTrainingDiff(baseline, parsedRows, weekStart),
		[baseline, parsedRows, weekStart],
	);
	const isDirty =
		diff.creates.length > 0 ||
		diff.updates.length > 0 ||
		diff.deleteIds.length > 0 ||
		rows.length !== baseline.length;
	isDirtyRef.current = isDirty;

	// Re-seed from server data. A background refresh must not discard edits in
	// progress, but the rows that come back from our own save — and the rows for
	// a week the coach navigated to — always win.
	useEffect(() => {
		const weekChanged = seededWeekRef.current !== currentWeekIsoDate;
		if (isDirtyRef.current && !awaitingSavedDataRef.current && !weekChanged) {
			return;
		}
		awaitingSavedDataRef.current = false;
		seededWeekRef.current = currentWeekIsoDate;
		setRows(baseline.map((event) => toBulkRow(event, weekStart)));
		setSelectedRows(new Set());
	}, [baseline, currentWeekIsoDate, weekStart]);

	useEffect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			if (!isDirtyRef.current) return;
			event.preventDefault();
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, []);

	// Spreadsheet paste appends rows, but only when the paste isn't aimed at a
	// field of its own — a multi-line description typed into the details drawer
	// must still land in that textarea.
	useEffect(() => {
		const handler = (event: ClipboardEvent) => {
			if (isTextEntryTarget(event.target)) return;
			const text = event.clipboardData?.getData("text") ?? "";
			if (!isDelimitedRows(text)) return;
			event.preventDefault();
			const pasted = parseDelimitedRows(text, weekStart);
			if (pasted.length) setRows((prev) => [...prev, ...pasted]);
		};
		window.addEventListener("paste", handler);
		return () => window.removeEventListener("paste", handler);
	}, [weekStart]);

	const removeRow = useCallback((rowId: string) => {
		setRows((prev) => prev.filter((row) => row.__id !== rowId));
	}, []);

	// A new row lands on the day after the last one, since a coach filling a week
	// works forwards through it; Saturday is the end of the grid so it stays put.
	const addRow = () => {
		const lastDayIndex = rows.at(-1)?.dayIndex;
		const dayIndex = lastDayIndex == null ? 0 : Math.min(6, lastDayIndex + 1);
		setRows((prev) => [
			...prev,
			{
				...createEmptyTrainingRow(dayIndex, weekStart),
				__id: crypto.randomUUID(),
			},
		]);
	};

	const editingRow = rows.find((row) => row.__id === editingRowId) ?? null;

	return (
		<SidebarProvider
			defaultOpen={false}
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			{/* The inset variant adds a 0.5rem margin all round, so the pinned height
			    has to give that back or the page gains a stray scrollbar. */}
			<SidebarInset className="xl:h-[calc(100svh-1rem)] xl:overflow-hidden">
				<SiteHeader
					breadcrumbs={[
						{ label: "Schedule", href: routes.schedule.list() },
						{ label: "Bulk edit training" },
					]}
				/>
				{/* On a phone the page scrolls as a whole. From xl — where the totals
				    rail sits alongside — the shell is pinned to the viewport and the
				    grid becomes the only thing that scrolls, so the toolbar and totals
				    stay in view while the coach works down the week. */}
				<div className="flex flex-1 flex-col xl:min-h-0">
					<TrainingWeekToolbar
						weekStart={weekStart}
						invalidRowCount={invalidRowCount}
						isDirty={isDirty}
						selectedCount={selectedRows.size}
						isSaving={saveTrainingWeek.isPending}
						onChangeWeek={(nextWeek) => {
							if (isDirty && !window.confirm(UNSAVED_PROMPT)) return;
							router.replace(
								routes.schedule.bulkEditTraining({ week: nextWeek }),
							);
						}}
						onAddRow={addRow}
						onRemoveSelected={() => {
							setRows((prev) =>
								prev.filter((row) => !selectedRows.has(row.__id)),
							);
							setSelectedRows(new Set());
						}}
						onSave={() => {
							setSaveError(null);
							if (invalidRowCount > 0) {
								setSaveError(
									`Fix ${invalidRowCount} highlighted ${invalidRowCount === 1 ? "row" : "rows"} before saving.`,
								);
								return;
							}
							// A save that deletes sessions people are going to, or moves ones
							// they've responded to, goes through the dialog so the coach sees
							// who it affects and decides whether they hear about it.
							const impact = computeSaveImpact(baseline, diff);
							if (impact.goingOnDeleted > 0 || impact.notifiableRsvps > 0) {
								setNotify(true);
								setPendingImpact(impact);
								return;
							}
							saveTrainingWeek.mutate({ ...diff, notify: true });
						}}
					/>

					{saveError ? (
						<div className="mx-4 mb-2 shrink-0 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive lg:mx-6">
							{saveError}
						</div>
					) : null}

					<div className="flex flex-1 flex-col gap-4 px-4 pb-6 lg:px-6 xl:min-h-0 xl:flex-row xl:pb-4">
						<TrainingWeekGrid
							rows={rows}
							rowErrors={rowErrors}
							weekStart={weekStart}
							selectedRows={selectedRows}
							isSaving={saveTrainingWeek.isPending}
							// Keeps generated titles ("Morning erg") in step as the coach
							// edits a row's time or mode — including via fill-down, which
							// arrives through here too.
							onRowsChange={(next) =>
								setRows((prev) => {
									const previousById = new Map(
										prev.map((row) => [row.__id, row]),
									);
									return next.map((row) => {
										const previous = previousById.get(row.__id);
										return previous && previous !== row
											? followAutoTitle(previous, row)
											: row;
									});
								})
							}
							onSelectedRowsChange={setSelectedRows}
							onAddRow={addRow}
							onOpenDetails={setEditingRowId}
							onRemoveRow={removeRow}
						/>
						<WeekTotalsPanel totals={totals} weekStart={weekStart} />
					</div>
				</div>
			</SidebarInset>
			<TrainingRowDrawers
				row={editingRow}
				savedEvent={baseline.find((event) => event.id === editingRow?.eventId)}
				weekStart={weekStart}
				onChange={(updated) => {
					setRows((prev) =>
						prev.map((row) => (row.__id === updated.__id ? updated : row)),
					);
					setEditingRowId(null);
				}}
				onRemove={() => {
					if (editingRow) removeRow(editingRow.__id);
					setEditingRowId(null);
				}}
				onClose={() => setEditingRowId(null)}
			/>
			<SaveWeekDialog
				impact={pendingImpact}
				notify={notify}
				isSaving={saveTrainingWeek.isPending}
				onNotifyChange={setNotify}
				onConfirm={() => saveTrainingWeek.mutate({ ...diff, notify })}
				onClose={() => setPendingImpact(null)}
			/>
		</SidebarProvider>
	);
};

const UNSAVED_PROMPT =
	"You have unsaved changes for this week. Leave without saving?";
