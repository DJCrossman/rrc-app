"use client";

import { IconCaretDown, IconCaretUp, IconPlus } from "@tabler/icons-react";
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
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatMeters } from "@/lib/formatters";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Erg, ErgsResult } from "@/lib/trpc/types";

const DEFAULT_PAGE_SIZE = 20;
const sortColumns = [
	"name",
	"manufacturer",
	"serialNumber",
	"firmwareVersion",
] as const;

const columns: ColumnDef<Erg>[] = [
	{
		accessorKey: "name",
		header: () => <div className="lg:w-100">Name</div>,
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				<Link
					href={routes.ergs.view(row.original.id)}
					className="font-medium hover:underline"
				>
					{row.original.name}
				</Link>
			</div>
		),
		enableSorting: true,
	},
	{
		accessorKey: "manufacturer",
		header: () => <div>Manufacturer</div>,
		cell: ({ row }) => (
			<Badge variant="outline">{row.original.manufacturer.toUpperCase()}</Badge>
		),
		enableSorting: true,
	},
	{
		accessorKey: "serialNumber",
		header: () => <div>Serial Number</div>,
		cell: ({ row }) => row.original.serialNumber || "N/A",
		enableSorting: true,
	},
	{
		accessorKey: "firmwareVersion",
		header: () => <div>Firmware</div>,
		cell: ({ row }) => row.original.firmwareVersion || "N/A",
		enableSorting: true,
	},
	{
		accessorKey: "meters",
		header: () => <div className="w-full">Total Meters</div>,
		cell: ({ row }) => formatMeters(row.original.meters),
		enableSorting: false,
	},
];

interface IErgTableProps {
	initialData: ErgsResult;
}

export function ErgTable({ initialData }: IErgTableProps) {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});
	const [sorting, setSorting] = useState<SortingState>([]);

	const sort = sorting[0];
	const { data } = trpcClient.ergs.getErgs.useQuery(
		{
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			sortBy: sortColumns.find((column) => column === sort?.id),
			order: sort ? (sort.desc ? "desc" : "asc") : undefined,
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
				<div className="flex items-center gap-2">
					<Label className="text-sm font-medium">
						Total ERGs: {data.totalCount}
					</Label>
				</div>
				<Button size="sm" asChild>
					<Link href={routes.ergs.create()}>
						<IconPlus className="h-4 w-4 mr-2" />
						Add ERG
					</Link>
				</Button>
			</div>
			<div className="rounded-md border mx-4 lg:mx-6">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : header.column.getCanSort() ? (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => header.column.toggleSorting()}
													className="h-8 p-0 hover:bg-transparent"
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{{
														asc: <IconCaretUp className="ml-2 h-4 w-4" />,
														desc: <IconCaretDown className="ml-2 h-4 w-4" />,
													}[header.column.getIsSorted() as string] ?? null}
												</Button>
											) : (
												flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
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
									No ergs found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between px-4 py-4 lg:px-6">
				<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
					{data.totalCount} {data.totalCount === 1 ? "erg" : "ergs"}
				</div>
				<DataTablePagination table={table} />
			</div>
		</div>
	);
}
