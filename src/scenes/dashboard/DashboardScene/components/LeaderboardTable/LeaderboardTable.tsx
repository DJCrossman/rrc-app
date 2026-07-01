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
}

export function LeaderboardTable({ data }: ILeaderboardTableProps) {
	const [rowSelection, setRowSelection] = useState({});
	const [programIds, setProgramIds] = useState<string[]>([]);
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
			<div className="flex items-center justify-between p-4 lg:px-6">
				<Label htmlFor="view-selector" className="sr-only">
					Programs
				</Label>
				<MultiSelect
					className="min-w-[240px]"
					placeholder="All Programs"
					options={programOptions}
					value={selectedProgramOptions}
					onChange={(opts) => setProgramIds(opts.map((o) => o.value))}
				/>

				<div className="flex items-center gap-2">
					<Button asChild variant="outline" size="sm">
						<Link href={routes.activities.create()}>
							<IconPlus />
							<span className="hidden lg:inline">Track Activity</span>
						</Link>
					</Button>
				</div>
			</div>
			<div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
				<div className="overflow-hidden rounded-lg border">
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
