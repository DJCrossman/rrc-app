"use client";

import {
	IconCaretDown,
	IconCaretUp,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconPlus,
} from "@tabler/icons-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
		accessorKey: "memberships",
		header: "Programs",
		cell: ({ row }) => {
			const items = row.original.memberships ?? [];
			if (items.length === 0) return null;
			return (
				<div className="flex flex-wrap gap-1">
					{items.map((m) => (
						<Badge
							key={m.id}
							variant="outline"
							className="text-muted-foreground px-1.5"
						>
							{m.name}
						</Badge>
					))}
				</div>
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
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to first page</span>
								<IconChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to previous page</span>
								<IconChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to next page</span>
								<IconChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to last page</span>
								<IconChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
