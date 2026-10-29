"use client";

import { IconChevronRight } from "@tabler/icons-react";
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
import { cn } from "@/lib/utils";

const TILE_TINTS = [
	"bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
	"bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
	"bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
	"bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
	"bg-muted text-foreground/80",
];

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
	const getGroupHref = canEdit ? routes.groups.view : routes.groups.detail;
	const columns = useMemo(() => getColumns(getGroupHref), [getGroupHref]);
	const table = useReactTable({
		data: groups,
		columns,
		getRowId: (row) => row.id,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
			<ul className="flex flex-col gap-2 md:hidden">
				{groups.length === 0 && (
					<li className="p-4 text-center text-sm text-muted-foreground">
						No groups yet.
					</li>
				)}
				{groups.map((group, index) => (
					<li key={group.id}>
						<Link
							href={getGroupHref(group.id)}
							className="flex items-center gap-3.5 rounded-xl border bg-card p-3.5 text-card-foreground hover:bg-muted"
						>
							<span
								className={cn(
									"flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold",
									TILE_TINTS[index % TILE_TINTS.length],
								)}
							>
								{getInitials(group.name)}
							</span>
							<span className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="truncate text-[17px] font-semibold">
									{group.name}
								</span>
								<span className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
									{group.memberCount}{" "}
									{group.memberCount === 1 ? "member" : "members"}
									{group.programs.map((program) => (
										<Badge
											key={program.id}
											variant="outline"
											className="text-muted-foreground px-1.5"
										>
											{program.name}
										</Badge>
									))}
								</span>
							</span>
							<IconChevronRight className="size-5 shrink-0 text-muted-foreground" />
						</Link>
					</li>
				))}
			</ul>
			<div className="overflow-hidden rounded-lg border max-md:hidden">
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

function getInitials(name: string) {
	const words = name.split(/\s+/).filter(Boolean);
	const letters =
		words.length > 1
			? words.slice(0, 2).map((word) => word.charAt(0))
			: name.slice(0, 2).split("");
	return letters.join("").toUpperCase();
}
