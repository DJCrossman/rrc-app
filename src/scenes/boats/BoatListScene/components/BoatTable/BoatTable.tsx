"use client";

import {
	IconCaretDown,
	IconCaretUp,
	IconChevronDown,
	IconPlus,
} from "@tabler/icons-react";
import { keepPreviousData } from "@tanstack/react-query";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useState } from "react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
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
	formatManufacturer,
	formatMeters,
	formatSeatSetup,
	formatWeightRange,
} from "@/lib/formatters";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Boat, BoatsResult } from "@/lib/trpc/types";
import { SeatTypes } from "@/schemas";

const DEFAULT_PAGE_SIZE = 20;
const boatSizes = ["all", ...SeatTypes] as const;
const sortColumns = ["name", "manufacturer", "seats", "rigging"] as const;

const columns: ColumnDef<Boat>[] = [
	{
		accessorKey: "name",
		header: () => <div className="lg:w-100">Name</div>,
		cell: ({ row }) => (
			<Link href={routes.boats.view(row.original.id)}>{row.original.name}</Link>
		),
		enableHiding: false,
		enableSorting: true,
	},
	{
		accessorKey: "manufacturer",
		header: "Manufacturer",
		cell: ({ row }) => (
			<div className="w-16">
				<Badge variant="outline" className="text-muted-foreground px-1.5">
					{formatManufacturer(row.original.manufacturer)}
				</Badge>
			</div>
		),
		enableSorting: true,
	},
	{
		accessorKey: "seats",
		header: "Seats",
		cell: ({ row }) => formatSeatSetup(row.original),
		enableHiding: false,
		enableSorting: true,
	},
	{
		accessorKey: "rigging",
		header: "Rigging",
		cell: ({ row }) =>
			row.original.rigging.charAt(0).toUpperCase() +
			row.original.rigging.slice(1),
		enableSorting: true,
	},
	{
		accessorKey: "meters",
		header: () => <div className="w-full">Meters</div>,
		cell: ({ row }) => formatMeters(row.original.meters),
		enableSorting: false,
	},
	{
		accessorKey: "weightRange",
		header: () => <div className="w-full">Weight</div>,
		cell: ({ row }) => formatWeightRange(row.original.weightRange),
		enableSorting: false,
	},
];

interface IBoatTableProps {
	initialData: BoatsResult;
}

export function BoatTable({ initialData }: IBoatTableProps) {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});
	const [sorting, setSorting] = useState<SortingState>([]);
	const [seats, setSeats] = useState<(typeof SeatTypes)[number] | undefined>(
		undefined,
	);

	const sort = sorting[0];
	const { data } = trpcClient.boats.getBoats.useQuery(
		{
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			sortBy: sortColumns.find((column) => column === sort?.id),
			order: sort ? (sort.desc ? "desc" : "asc") : undefined,
			seats,
		},
		{ initialData, placeholderData: keepPreviousData },
	);

	const table = useReactTable({
		data: data.data,
		columns,
		state: { pagination, sorting },
		getRowId: (row) => row.id.toString(),
		manualPagination: true,
		manualSorting: true,
		pageCount: data.totalPages,
		rowCount: data.totalCount,
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="w-full flex-col justify-start gap-6">
			<div className="flex items-center justify-between p-4 lg:px-6">
				<Label htmlFor="view-selector" className="sr-only">
					View
				</Label>
				<Select
					value={seats ?? "all"}
					onValueChange={(value) => {
						setSeats(SeatTypes.find((size) => size === value));
						setPagination((prev) => ({ ...prev, pageIndex: 0 }));
					}}
				>
					<SelectTrigger className="flex w-fit" size="sm" id="view-selector">
						<SelectValue placeholder="Select a view" />
					</SelectTrigger>
					<SelectContent>
						{boatSizes.map((size) => (
							<SelectItem key={size} value={size}>
								{size === "all"
									? "All Boats"
									: formatSeatSetup({ seats: size })}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="flex items-center">
					<Button
						asChild
						variant="outline"
						size="sm"
						className="rounded-r-none"
					>
						<Link href={routes.boats.create()}>
							<IconPlus />
							<span className="hidden lg:inline">Add Boat</span>
						</Link>
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="rounded-l-none border-l-0 px-2"
								aria-label="More add options"
							>
								<IconChevronDown />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link href={routes.boats.bulkCreate()}>Bulk Add Boats</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
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
						{data.totalCount} boats.
					</div>
					<DataTablePagination table={table} />
				</div>
			</div>
		</div>
	);
}
