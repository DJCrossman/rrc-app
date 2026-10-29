"use client";

import { IconCaretDown, IconCaretUp, IconPlus } from "@tabler/icons-react";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { FlameIcon, SnowflakeIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { InitialsAvatar } from "@/components/chat/initials-avatar";
import { DataTablePagination } from "@/components/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	formatCompactDuration,
	formatCompactSplit,
	formatMeters,
} from "@/lib/formatters";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Leaderboard } from "@/lib/trpc/types";

const columns: ColumnDef<Leaderboard[number]>[] = [
	{
		accessorKey: "name",
		header: () => <div className="lg:w-100">Name</div>,
		enableHiding: false,
		enableSorting: true,
	},
	{
		accessorKey: "activeMembership",
		header: "Program",
		cell: ({ row }) => {
			const active = row.original.activeMembership;
			if (!active) return null;
			return (
				<Badge variant="outline" className="text-muted-foreground px-1.5">
					{active.name}
				</Badge>
			);
		},
		enableSorting: false,
	},
	{
		accessorKey: "meters",
		header: () => <div className="w-full">Meters</div>,
		cell: ({ row }) => formatMeters(row.original.meters),
		enableSorting: true,
	},
	// TODO: Add back later
	// {
	// 	accessorKey: "points",
	// 	header: () => <div className="w-full">Points</div>,
	// 	enableSorting: true,
	// },
	{
		accessorKey: "bestTwoKm",
		header: "Best 2K",
		cell: ({ row }) => {
			const value = row.original.bestTwoKm;
			if (!value) return "-";
			return (
				<Tooltip>
					<TooltipTrigger className="cursor-help">
						{formatCompactDuration(value)}
					</TooltipTrigger>
					<TooltipContent>{formatCompactSplit(value, 2000)}</TooltipContent>
				</Tooltip>
			);
		},
		enableSorting: true,
	},
	{
		accessorKey: "bestSixKm",
		header: "Best 6K",
		cell: ({ row }) => {
			const value = row.original.bestSixKm;
			if (!value) return "-";
			return (
				<Tooltip>
					<TooltipTrigger className="cursor-help">
						{formatCompactDuration(value)}
					</TooltipTrigger>
					<TooltipContent>{formatCompactSplit(value, 6000)}</TooltipContent>
				</Tooltip>
			);
		},
		enableSorting: true,
	},
	{
		accessorKey: "streak",
		header: "Streak",
		cell: ({ row }) => {
			if (row.original.streak === 0) {
				return (
					<span className="text-blue-600 dark:text-blue-400">
						0 <SnowflakeIcon className="inline" size={14} />
					</span>
				);
			}
			return (
				<span className="text-red-600 dark:text-red-400">
					{row.original.streak} <FlameIcon className="inline" size={14} />
				</span>
			);
		},
		enableSorting: true,
	},
];

interface ILeaderboardTableProps {
	data: Leaderboard;
	initialProgramIds?: string[];
}

export function LeaderboardTable({
	data,
	initialProgramIds = [],
}: ILeaderboardTableProps) {
	const [rowSelection, setRowSelection] = useState({});
	const [programIds, setProgramIds] = useState<string[]>(initialProgramIds);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "meters", desc: true },
	]);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const programsQuery = trpcClient.programs.getPrograms.useQuery();
	const programOptions: Option[] = useMemo(
		() =>
			(programsQuery.data?.data ?? []).map((p) => ({
				value: p.id,
				label: p.name,
			})),
		[programsQuery.data],
	);
	const selectedProgramOptions = useMemo(
		() => programOptions.filter((o) => programIds.includes(o.value)),
		[programOptions, programIds],
	);

	const filteredData = useMemo(() => {
		if (programIds.length === 0) return data;
		return data.filter((item) => {
			const memberships = item.memberships ?? [];
			return memberships.some((m) => programIds.includes(m.programId));
		});
	}, [data, programIds]);

	const table = useReactTable({
		data: filteredData,
		columns,
		state: {
			sorting,
			rowSelection,
			pagination,
		},
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<div className="w-full flex-col justify-start gap-6">
			<div className="flex items-center justify-between gap-3 p-4 max-md:flex-wrap lg:px-6">
				<h2 className="text-base font-semibold md:hidden">Leaderboard</h2>
				<Label htmlFor="view-selector" className="sr-only">
					Programs
				</Label>
				<MultiSelect
					className="min-w-[240px]"
					commandProps={{ className: "max-md:order-last" }}
					placeholder="All Programs"
					options={programOptions}
					value={selectedProgramOptions}
					onChange={(opts) => setProgramIds(opts.map((o) => o.value))}
				/>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						render={<Link href={routes.activities.create()} />}
					>
						<IconPlus />
						<span className="hidden max-md:inline lg:inline">
							Track Activity
						</span>
					</Button>
				</div>
			</div>
			<div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
				<ol className="divide-y overflow-hidden rounded-lg border bg-card md:hidden">
					{table.getRowModel().rows.length === 0 && (
						<li className="p-4 text-center text-sm text-muted-foreground">
							No results.
						</li>
					)}
					{table.getRowModel().rows.map((row, index) => (
						<li
							key={row.id}
							className="flex min-h-13 items-center gap-3 px-3.5 py-2"
						>
							<span className="w-5 shrink-0 text-center text-[13px] font-bold text-muted-foreground tabular-nums">
								{pagination.pageIndex * pagination.pageSize + index + 1}
							</span>
							<InitialsAvatar
								initials={getInitials(row.original.name)}
								size="sm"
								className="rounded-full"
							/>
							<span className="flex min-w-0 flex-1 flex-col">
								<span className="truncate text-sm font-medium">
									{row.original.name}
								</span>
								{row.original.activeMembership && (
									<span className="truncate text-xs text-muted-foreground">
										{row.original.activeMembership.name}
									</span>
								)}
							</span>
							<span className="flex items-center gap-1 text-xs tabular-nums">
								{row.original.streak > 0 ? (
									<span className="text-red-600 dark:text-red-400">
										{row.original.streak}{" "}
										<FlameIcon className="inline" size={12} />
									</span>
								) : (
									<span className="text-blue-600 dark:text-blue-400">
										0 <SnowflakeIcon className="inline" size={12} />
									</span>
								)}
							</span>
							<span className="shrink-0 text-sm font-semibold whitespace-nowrap tabular-nums">
								{formatMeters(row.original.meters)}
							</span>
						</li>
					))}
				</ol>
				<div className="overflow-hidden rounded-lg border max-md:hidden">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead
												key={header.id}
												colSpan={header.colSpan}
												onClick={header.column.getToggleSortingHandler()}
											>
												<div className="flex items-center gap-2">
													{header.isPlaceholder
														? null
														: flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
													{{
														asc: <IconCaretUp />,
														desc: <IconCaretDown />,
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody className="**:data-[slot=table-cell]:first:w-8">
							{table.getRowModel().rows?.length ? (
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
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<DataTablePagination table={table} />
				</div>
			</div>
		</div>
	);
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part.charAt(0).toUpperCase())
		.slice(0, 2)
		.join("");
}
