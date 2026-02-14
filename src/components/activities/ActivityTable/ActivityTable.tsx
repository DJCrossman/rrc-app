import {
	IconBrandStrava,
	IconSailboat2,
	IconTreadmill,
} from "@tabler/icons-react";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { DateTime } from "luxon";
import Link from "next/link";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatDuration } from "@/lib/formatters/formatDuration";
import { formatMeters } from "@/lib/formatters/formatMeters";
import { routes } from "@/lib/routes";
import type { Activities, Activity } from "@/schemas";

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
	},
	{
		accessorKey: "startDate",
		header: "Date",
		cell: ({ row }) => {
			const date = DateTime.fromISO(row.original.startDate);
			return date.toISODate();
		},
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
			return row.original.name;
		},
	},
	{
		accessorKey: "athlete.name",
		header: "Athlete",
		cell: ({ row }) => row.original.athlete.name,
	},
	// TODO: Re-enable Boats and ERGs navigation
	// {
	// 	accessorKey: "boat.name",
	// 	header: "Boat",
	// 	cell: ({ row }) => row.original.boat?.name || "Concept2 ERG",
	// },
	{
		accessorKey: "isStrava",
		header: "",
		cell: ({ row }) => (row.original.isStrava ? <IconBrandStrava /> : null),
	},
	{
		accessorKey: "score",
		header: "Score",
		cell: ({ row }) => {
			if (row.original.workoutType === "distance") {
				return formatDuration(row.original.elaspedTime);
			}
			return formatMeters(row.original.distance);
		},
	},
];

interface ActivityTableProps {
	data: Activities;
	showColumns?: string[];
}

export const ActivityTable = ({
	data: activities,
	showColumns,
}: ActivityTableProps) => {
	const table = useReactTable({
		data: activities,
		columns: columns.filter((column) => {
			if (!showColumns || !("accessorKey" in column)) return true;
			return showColumns.includes(column.accessorKey);
		}),
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<>
			<h2 className="text-xl font-bold mb-4">Activities</h2>
			<div className="overflow-auto">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
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
								<TableCell colSpan={columns.length} className="text-center">
									No activities found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</>
	);
};
