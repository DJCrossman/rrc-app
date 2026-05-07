"use client";

import {
	IconCaretDown,
	IconCaretUp,
	IconChevronDown,
	IconCircleCheck,
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
import { DateTime } from "luxon";
import Link from "next/link";
import { useMemo, useState } from "react";
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
import type { Athlete, Athletes } from "@/lib/trpc/types";

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
		enableSorting: true,
	},
	{
		accessorKey: "activeMembership",
		header: "Active",
		sortingFn: (rowA, rowB) => {
			const a = rowA.getValue("activeMembership") ? 1 : 0;
			const b = rowB.getValue("activeMembership") ? 1 : 0;
			return a - b;
		},
		cell: ({ row }) =>
			row.original.activeMembership ? (
				<IconCircleCheck size={16} className="text-green-500" />
			) : null,
	},
	{
		accessorKey: "memberships",
		header: "Programs",
		cell: ({ row }) => {
			const items = row.original.memberships ?? [];
			if (items.length === 0) return "";
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
		accessorKey: "dateJoined",
		header: "Date Joined",
		cell: ({ row }) =>
			row.original.dateJoined &&
			DateTime.fromISO(row.original.dateJoined).toLocaleString({
				month: "short",
				year: "numeric",
			}),
	},
];

interface IAthleteTableProps {
	data: Athletes;
}

export function AthleteTable({ data }: IAthleteTableProps) {
	const [filterBy, setFilterBy] = useState<{
		programIds: string[];
		isActive?: "true" | "false" | "all";
	}>({ programIds: [], isActive: "all" });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 100,
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
		() => programOptions.filter((o) => filterBy.programIds.includes(o.value)),
		[programOptions, filterBy.programIds],
	);

	const filteredData = useMemo(() => {
		return data.filter((item) => {
			if (filterBy.programIds.length > 0) {
				const memberships = item.memberships ?? [];
				const matches = memberships.some((m) =>
					filterBy.programIds.includes(m.programId),
				);
				if (!matches) return false;
			}
			if (filterBy.isActive !== undefined && filterBy.isActive !== "all") {
				return !!item.activeMembership === (filterBy.isActive === "true");
			}
			return true;
		});
	}, [data, filterBy]);

	const table = useReactTable({
		data: filteredData,
		columns,
		state: {
			sorting,
			pagination,
		},
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
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
				<div className="flex items-center gap-2">
					<Label htmlFor="program-selector" className="sr-only">
						Programs
					</Label>
					<MultiSelect
						className="min-w-[240px]"
						placeholder="All Programs"
						options={programOptions}
						value={selectedProgramOptions}
						onChange={(opts) =>
							setFilterBy((prev) => ({
								...prev,
								programIds: opts.map((o) => o.value),
							}))
						}
					/>
					<Label htmlFor="active-membership-selector" className="sr-only">
						Active Membership
					</Label>
					<Select
						defaultValue="all"
						value={filterBy.isActive?.toString()}
						onValueChange={(value) => {
							setFilterBy((prev) => ({
								...prev,
								isActive:
									activeMembershipOptions.find((i) => i === value) || "all",
							}));
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
						{table.getFilteredRowModel().rows.length} of {data.length} athletes.
					</div>
				</div>
			</div>
		</div>
	);
}
