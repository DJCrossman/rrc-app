"use client";

import {
	IconCaretDown,
	IconCaretUp,
	IconPlus,
	IconSailboat2,
	IconTreadmill,
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
import { useState } from "react";
import { DataTablePagination } from "@/components/data-table-pagination";
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
import { useCurrentUser } from "@/hooks/useAuth";
import { formatDurationAsTime } from "@/lib/formatters/formatDuration";
import { formatMeters } from "@/lib/formatters/formatMeters";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { ActivitiesResult, Activity } from "@/lib/trpc/types";
import { ActivityType, WorkoutType } from "@/schemas";
import { SyncMenu } from "./SyncMenu";

const DEFAULT_PAGE_SIZE = 20;
const activityTypeOptions = ["all", ...ActivityType] as const;
const workoutTypeOptions = ["all", ...WorkoutType] as const;
const sortColumns = ["startDate", "name", "type"] as const;

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
		enableSorting: true,
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
		accessorKey: "athlete.name",
		header: "Athlete",
		cell: ({ row }) => row.original.athlete.name,
		enableSorting: false,
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
				<Link href={routes.activities.view(row.original.id)}>
					{row.original.name}
				</Link>
			);
		},
		enableHiding: false,
		enableSorting: true,
	},
	// {
	// 	accessorKey: "boat.name",
	// 	header: "Boat/ERG",
	// 	cell: ({ row }) =>
	// 		row.original.boat?.name || row.original.erg?.name || "N/A",
	// },
	{
		accessorKey: "score",
		header: "Score",
		cell: ({ row }) => {
			if (row.original.workoutType === "distance") {
				return formatDurationAsTime(row.original.elapsedTime);
			}
			return formatMeters(row.original.distance);
		},
		enableSorting: false,
	},
];

interface ActivityTableProps {
	initialData: ActivitiesResult;
}

export function ActivityTable({ initialData }: ActivityTableProps) {
	const { user } = useCurrentUser();
	const hasIntegration = user.stravaConnected || user.concept2Connected;

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "startDate", desc: true },
	]);
	const [type, setType] = useState<(typeof ActivityType)[number] | undefined>(
		undefined,
	);
	const [workoutType, setWorkoutType] = useState<
		(typeof WorkoutType)[number] | undefined
	>(undefined);

	const sort = sorting[0];
	const { data } = trpcClient.activities.getActivities.useQuery(
		{
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			sortBy: sortColumns.find((column) => column === sort?.id),
			order: sort ? (sort.desc ? "desc" : "asc") : undefined,
			type,
			workoutType,
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
		enableSortingRemoval: false,
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
					<Label htmlFor="type-selector" className="sr-only">
						Activity Type
					</Label>
					<Select
						value={type ?? "all"}
						onValueChange={(value) => {
							setType(ActivityType.find((option) => option === value));
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
					>
						<SelectTrigger className="flex w-fit" size="sm" id="type-selector">
							<SelectValue placeholder="Select activity type" />
						</SelectTrigger>
						<SelectContent>
							{activityTypeOptions.map((option) => (
								<SelectItem key={option} value={option}>
									{option === "all"
										? "All Types"
										: option === "water"
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
						value={workoutType ?? "all"}
						onValueChange={(value) => {
							setWorkoutType(WorkoutType.find((option) => option === value));
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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
							{workoutTypeOptions.map((option) => (
								<SelectItem key={option} value={option}>
									{option === "all"
										? "All Workout Types"
										: option.charAt(0).toUpperCase() + option.slice(1)}
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
						className={hasIntegration ? "rounded-r-none" : undefined}
					>
						<Link href={routes.activities.create()}>
							<IconPlus />
							<span className="hidden lg:inline">Add Activity</span>
						</Link>
					</Button>
					<SyncMenu />
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
												className={
													header.column.getCanSort()
														? "cursor-pointer select-none"
														: undefined
												}
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
						{data.totalCount}{" "}
						{data.totalCount === 1 ? "activity" : "activities"}
					</div>
					<DataTablePagination table={table} />
				</div>
			</div>
		</div>
	);
}
