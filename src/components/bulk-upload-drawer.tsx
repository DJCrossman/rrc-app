"use client";

import {
	IconAlertCircle,
	IconPlus,
	IconTrash,
	IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Column, DataGrid, SelectColumn } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface BulkUploadDrawerProps<TRow> {
	isOpen: boolean;
	onClose: () => void;
	schema: z.ZodType<TRow>;
	columns: readonly Column<Partial<TRow>>[];
	onSubmit: (rows: TRow[]) => Promise<void> | void;
}

type InternalRow<TRow> = Partial<TRow> & { __id: string };

export function BulkUploadDrawer<TRow>({
	isOpen,
	onClose,
	schema,
	columns,
	onSubmit,
}: BulkUploadDrawerProps<TRow>) {
	const [rows, setRows] = useState<InternalRow<TRow>[]>(() => [
		createEmptyRow<TRow>(),
	]);
	const [rowErrors, setRowErrors] = useState<Record<string, z.ZodError>>({});
	const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
		new Set(),
	);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Reset state when the drawer is closed externally so the next open is fresh.
	useEffect(() => {
		if (!isOpen) {
			setRows([createEmptyRow<TRow>()]);
			setRowErrors({});
			setSelectedRows(new Set());
			setSubmitError(null);
			setIsSubmitting(false);
		}
	}, [isOpen]);

	// Listen for paste while the drawer is open. If the clipboard contains
	// multi-row data (CSV/TSV), parse it and append rows. Single-cell pastes
	// fall through to the active editor's native paste handler.
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: ClipboardEvent) => {
			const text = e.clipboardData?.getData("text") ?? "";
			if (!text.includes("\n")) return;
			e.preventDefault();
			const userKeys = columns.map((c) => c.key);
			const lines = text
				.replace(/\r\n/g, "\n")
				.split("\n")
				.filter((line) => line.trim().length > 0);
			if (lines.length === 0) return;
			const delimiter = lines[0].includes("\t") ? "\t" : ",";
			const newRows: InternalRow<TRow>[] = lines.map((line) => {
				const cells = line.split(delimiter);
				const row = createEmptyRow<TRow>();
				cells.forEach((cell, i) => {
					const key = userKeys[i];
					const trimmed = cell.trim();
					if (key && trimmed) {
						(row as Record<string, unknown>)[key] = trimmed;
					}
				});
				return row;
			});
			setRows((prev) => {
				const isFirstRowEmpty =
					prev.length === 1 &&
					Object.keys(prev[0]).filter((k) => k !== "__id").length === 0;
				return isFirstRowEmpty ? newRows : [...prev, ...newRows];
			});
		};
		window.addEventListener("paste", handler);
		return () => window.removeEventListener("paste", handler);
	}, [isOpen, columns]);

	const handleAddRow = useCallback(() => {
		setRows((prev) => [...prev, createEmptyRow<TRow>()]);
	}, []);

	const handleRemoveSelected = useCallback(() => {
		setRows((prev) => prev.filter((r) => !selectedRows.has(r.__id)));
		setSelectedRows(new Set());
	}, [selectedRows]);

	const handleSave = useCallback(async () => {
		setSubmitError(null);
		const errors: Record<string, z.ZodError> = {};
		const parsed: TRow[] = [];
		for (const row of rows) {
			const { __id, ...userRow } = row;
			const result = schema.safeParse(userRow);
			if (result.success) {
				parsed.push(result.data);
			} else {
				errors[__id] = result.error;
			}
		}
		if (Object.keys(errors).length > 0) {
			setRowErrors(errors);
			return;
		}
		setRowErrors({});
		setIsSubmitting(true);
		try {
			await onSubmit(parsed);
			onClose();
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Failed to save");
		} finally {
			setIsSubmitting(false);
		}
	}, [onClose, onSubmit, rows, schema]);

	const wrappedColumns = useMemo<Column<InternalRow<TRow>>[]>(() => {
		const statusColumn: Column<InternalRow<TRow>> = {
			key: "__status",
			name: "",
			width: 60,
			minWidth: 60,
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

		const userColumns = (
			columns as unknown as readonly Column<InternalRow<TRow>>[]
		).map((col): Column<InternalRow<TRow>> => {
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
		});

		return [
			SelectColumn as Column<InternalRow<TRow>>,
			statusColumn,
			...userColumns,
		];
	}, [columns, rowErrors]);

	return (
		<Drawer
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			direction="right"
			dismissible={false}
			handleOnly
			modal={false}
		>
			<DrawerContent className="!w-screen !max-w-none">
				<DrawerHeader className="flex flex-row items-center justify-between border-b">
					<div>
						<DrawerTitle>Bulk Upload</DrawerTitle>
						<DrawerDescription>
							Add multiple records at once. Edit cells inline, or paste CSV/TSV
							data to fill rows.
						</DrawerDescription>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
					>
						<IconX className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</button>
				</DrawerHeader>

				{submitError ? (
					<div className="border-b bg-destructive/10 px-6 py-3 text-sm text-destructive">
						{submitError}
					</div>
				) : null}

				<div className="flex items-center gap-2 border-b px-6 py-3">
					<Button variant="outline" size="sm" onClick={handleAddRow}>
						<IconPlus />
						Add row
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleRemoveSelected}
						disabled={selectedRows.size === 0}
					>
						<IconTrash />
						Remove selected ({selectedRows.size})
					</Button>
					<div className="ml-auto text-sm text-muted-foreground">
						{rows.length} {rows.length === 1 ? "row" : "rows"}
					</div>
				</div>

				<div className="flex-1 overflow-hidden p-6">
					<DataGrid
						className="rdg-light h-full"
						columns={wrappedColumns}
						rows={rows}
						onRowsChange={setRows}
						rowKeyGetter={(row) => row.__id}
						selectedRows={selectedRows}
						onSelectedRowsChange={setSelectedRows}
					/>
				</div>

				<div className="flex justify-end gap-2 border-t px-6 py-4">
					<Button
						variant="outline"
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleSave} disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : "Save"}
					</Button>
				</div>
			</DrawerContent>
		</Drawer>
	);
}

function createEmptyRow<TRow>(): InternalRow<TRow> {
	return { __id: crypto.randomUUID() } as InternalRow<TRow>;
}
