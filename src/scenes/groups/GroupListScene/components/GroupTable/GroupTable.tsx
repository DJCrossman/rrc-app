"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { DateTime } from "luxon";
import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { routes } from "@/lib/routes";
import type { Groups } from "@/lib/trpc/types";

const getColumns = (
	getGroupHref: (id: string) => string,
): ColumnDef<Groups[number]>[] => [
	{
		accessorKey: "name",
		header: () => <div className="lg:w-60">Group</div>,
		cell: ({ row }) => (
			<Link href={getGroupHref(row.original.id)}>{row.original.name}</Link>
		),
	},
	{
		id: "programs",
		header: "Auto-includes",
		cell: ({ row }) =>
			row.original.programs.length ? (
				<div className="flex flex-wrap gap-1">
					{row.original.programs.map((program) => (
						<Badge
							key={program.id}
							variant="outline"
							className="text-muted-foreground px-1.5"
						>
							{program.name}
						</Badge>
					))}
				</div>
			) : (
				<span className="text-muted-foreground">—</span>
			),
	},
	{
		accessorKey: "memberCount",
		header: "Members",
	},
];

interface IGroupTableProps {
	groups: Groups;
	lastSyncedAt: string | null;
	/** Admins open the group editor; everyone else opens the group's page. */
	canEdit: boolean;
}

export function GroupTable({
	groups,
	lastSyncedAt,
	canEdit,
}: IGroupTableProps) {
	const columns = useMemo(
		() => getColumns(canEdit ? routes.groups.view : routes.groups.detail),
		[canEdit],
	);
	const table = useReactTable({
		data: groups,
		columns,
		getRowId: (row) => row.id,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="bg-muted sticky top-0 z-10">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} colSpan={header.colSpan}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No groups yet.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 px-4 text-sm">
				<span>
					{groups.length} {groups.length === 1 ? "group" : "groups"}.
				</span>
				{lastSyncedAt && (
					<span suppressHydrationWarning>
						Last synced from RCA {DateTime.fromISO(lastSyncedAt).toRelative()}
					</span>
				)}
			</div>
		</div>
	);
}
