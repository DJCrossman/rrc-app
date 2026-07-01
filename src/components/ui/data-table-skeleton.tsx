import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface DataTableSkeletonProps {
	columns?: number;
	rows?: number;
}

export function DataTableSkeleton({
	columns = 5,
	rows = 8,
}: DataTableSkeletonProps) {
	const columnKeys = Array.from({ length: columns }, (_, i) => `col-${i}`);
	const rowKeys = Array.from({ length: rows }, (_, i) => `row-${i}`);

	return (
		<div className="overflow-hidden rounded-lg border">
			<Table>
				<TableHeader className="bg-muted">
					<TableRow>
						{columnKeys.map((key) => (
							<TableHead key={key}>
								<Skeleton className="h-4 w-20" />
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rowKeys.map((rowKey) => (
						<TableRow key={rowKey}>
							{columnKeys.map((columnKey) => (
								<TableCell key={`${rowKey}-${columnKey}`}>
									<Skeleton className="h-5 w-full" />
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
