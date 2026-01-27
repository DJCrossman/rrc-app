"use client";

import {
	IconCaretDown,
	IconCaretUp,
	IconPlus,
	IconSailboat2,
	IconTreadmill,
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
import { Button } from "@/components/ui/button";
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
import { formatDurationAsTime } from "@/lib/formatters/formatDuration";
import { formatMeters } from "@/lib/formatters/formatMeters";
import { routes } from "@/lib/routes";
import { type Activities, type Activity, ActivityType } from "@/schemas";

const activityTypeOptions = ["all", ...ActivityType] as const;
const workoutTypeOptions = ["all", "distance", "time", "other"] as const;

const columns: ColumnDef<Activity>[] = [
	{
		accessorKey: "type",
		header: "",
		cell: ({ row }) =>
			row.original.type === "water" ? (
				<IconSailboat2 className="h-4 w-4" />
			) : (
				<IconTreadmill className="h-4 w-4" />
			),
		enableHiding: false,
	},
	{
		accessorKey: "startDate",
		header: "Date",
		cell: ({ row }) => {
			const date = DateTime.fromISO(row.original.startDate);
			return date.toISODate();
		},
		enableSorting: true,
	},
	{
		accessorKey: "name",
		header: "Workout",
		cell: ({ row }) => {
			if (row.original.workout) {
				return (
					<Link
						href={routes.workouts.view({ id: row.original.workout.id })}
						className="hover:underline"
					>
						{row.original.name}
					</Link>
				);
			}
			return (
				<a href={routes.activities.view(row.original.id)}>
					{row.original.name}
				</a>
			);
		},
		enableHiding: false,
		enableSorting: true,
	},
	{
		accessorKey: "athlete.name",
		header: "Athlete",
		cell: ({ row }) => row.original.athlete.name,
		enableSorting: true,
	},
	{
		accessorKey: "boat.name",
		header: "Boat/ERG",
		cell: ({ row }) =>
			row.original.boat?.name || row.original.erg?.name || "N/A",
	},
	{
		accessorKey: "score",
		header: "Score",
		cell: ({ row }) => {
			if (row.original.workoutType === "distance") {
				return formatDurationAsTime(row.original.elaspedTime);
			}
			return formatMeters(row.original.distance);
		},
		enableSorting: true,
	},
];

interface ActivityTableProps {
	data: Activities;
}

export function ActivityTable({ data }: ActivityTableProps) {
	const [filterBy, setFilterBy] = useState<{
		type?: (typeof ActivityType)[number] | "all";
		workoutType?: "distance" | "time" | "other" | "all";
	}>({ type: "all", workoutType: "all" });
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "startDate", desc: true },
	]);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 100,
	});

	const filteredData = useMemo(() => {
		return data.filter((item) => {
			if (filterBy.type && filterBy.type !== "all") {
				if (item.type !== filterBy.type) return false;
			}
			if (filterBy.workoutType && filterBy.workoutType !== "all") {
				if (item.workoutType !== filterBy.workoutType) return false;
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
					<Label htmlFor="type-selector" className="sr-only">
						Activity Type
					</Label>
					<Select
						defaultValue="all"
						value={filterBy.type}
						onValueChange={(value) => {
							setFilterBy((prev) => ({
								...prev,
								type: activityTypeOptions.find((i) => i === value) || "all",
							}));
						}}
					>
						<SelectTrigger className="flex w-fit" size="sm" id="type-selector">
							<SelectValue placeholder="Select activity type" />
						</SelectTrigger>
						<SelectContent>
							{activityTypeOptions.map((type) => (
								<SelectItem key={type} value={type}>
									{type === "all"
										? "All Types"
										: type === "water"
											? "Water"
											: "ERG"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Label htmlFor="workout-type-selector" className="sr-only">
						Workout Type
					</Label>
					<Select
						defaultValue="all"
						value={filterBy.workoutType}
						onValueChange={(value) => {
							setFilterBy((prev) => ({
								...prev,
								workoutType:
									workoutTypeOptions.find((i) => i === value) || "all",
							}));
						}}
					>
						<SelectTrigger
							className="flex w-fit"
							size="sm"
							id="workout-type-selector"
						>
							<SelectValue placeholder="Select workout type" />
						</SelectTrigger>
						<SelectContent>
							{workoutTypeOptions.map((workoutType) => (
								<SelectItem key={workoutType} value={workoutType}>
									{workoutType === "all"
										? "All Workout Types"
										: workoutType.charAt(0).toUpperCase() +
											workoutType.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-2">
					<Button asChild variant="outline" size="sm">
						<a href={routes.activities.create()}>
							<IconPlus />
							<span className="hidden lg:inline">Add Activity</span>
						</a>
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
						{table.getFilteredRowModel().rows.length} of {data.length}{" "}
						activities.
					</div>
				</div>
			</div>
		</div>
	);
}
