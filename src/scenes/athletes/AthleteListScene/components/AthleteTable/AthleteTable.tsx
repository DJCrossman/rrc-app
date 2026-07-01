"use client";

import {
	IconCaretDown,
	IconCaretUp,
	IconChevronDown,
	IconCircleCheck,
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
import { DateTime } from "luxon";
import Link from "next/link";
import { useMemo, useState } from "react";
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
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Athlete, AthletesResult } from "@/lib/trpc/types";

const DEFAULT_PAGE_SIZE = 20;
const sortColumns = ["dateJoined"] as const;
const activeMembershipOptions = ["all", "true", "false"] as const;

const columns: ColumnDef<Athlete>[] = [
	{
		accessorKey: "name",
		header: () => <div className="lg:w-100">Name</div>,
		cell: ({ row }) => (
			<Link href={routes.athletes.view(row.original.id)}>
				{row.original.name}
			</Link>
		),
		enableHiding: false,
		enableSorting: false,
	},
	{
		accessorKey: "activeMembership",
		header: "Active",
		cell: ({ row }) =>
			row.original.activeMembership ? (
				<IconCircleCheck size={16} className="text-green-500" />
			) : null,
		enableSorting: false,
	},
	{
		id: "program",
		header: "Program",
		cell: ({ row }) => {
			const m = row.original.activeMembership;
			if (!m) return "";
			return (
				<Badge variant="outline" className="text-muted-foreground px-1.5">
					{m.name}
				</Badge>
			);
		},
		enableSorting: false,
	},
	{
		accessorKey: "dateJoined",
		header: "Date Joined",
		cell: ({ row }) =>
			row.original.dateJoined &&
			DateTime.fromISO(row.original.dateJoined).toLocaleString({
				month: "short",
				year: "numeric",
			}),
		enableSorting: true,
	},
];

interface IAthleteTableProps {
	initialData: AthletesResult;
}

export function AthleteTable({ initialData }: IAthleteTableProps) {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});
	const [sorting, setSorting] = useState<SortingState>([]);
	const [programIds, setProgramIds] = useState<string[]>([]);
	const [isActive, setIsActive] = useState<boolean | undefined>(undefined);

	const sort = sorting[0];
	const { data } = trpcClient.athletes.getAthletes.useQuery(
		{
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			sortBy: sortColumns.find((column) => column === sort?.id),
			order: sort ? (sort.desc ? "desc" : "asc") : undefined,
			programIds: programIds.length ? programIds : undefined,
			isActive,
		},
		{ initialData, placeholderData: keepPreviousData },
	);

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
					<Label htmlFor="program-selector" className="sr-only">
						Programs
					</Label>
					<MultiSelect
						className="min-w-[240px]"
						placeholder="All Programs"
						options={programOptions}
						value={selectedProgramOptions}
						onChange={(opts) => {
							setProgramIds(opts.map((o) => o.value));
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
					/>
					<Label htmlFor="active-membership-selector" className="sr-only">
						Active Membership
					</Label>
					<Select
						value={isActive === undefined ? "all" : isActive ? "true" : "false"}
						onValueChange={(value) => {
							setIsActive(value === "all" ? undefined : value === "true");
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
					>
						<SelectTrigger
							className="flex w-fit"
							size="sm"
							id="active-membership-selector"
						>
							<SelectValue placeholder="Select a program" />
						</SelectTrigger>
						<SelectContent>
							{activeMembershipOptions.map((membership) => (
								<SelectItem key={membership} value={membership}>
									{membership === "all"
										? "Active & Inactive"
										: membership === "true"
											? "Active"
											: "Inactive"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center">
					<Button
						asChild
						variant="outline"
						size="sm"
						className="rounded-r-none"
					>
						<Link href={routes.athletes.create()}>
							<IconPlus />
							<span className="hidden lg:inline">Add Athlete</span>
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
								<Link href={routes.athletes.bulkCreate()}>
									Bulk Add Athletes
								</Link>
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
						{data.totalCount} athletes.
					</div>
					<DataTablePagination table={table} />
				</div>
			</div>
		</div>
	);
}
