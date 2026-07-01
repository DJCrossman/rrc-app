import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function LeaderboardTableSkeleton() {
	return (
		<div className="w-full flex-col justify-start gap-6">
			<div className="flex items-center justify-between p-4 lg:px-6">
				<Skeleton className="h-9 w-[240px]" />
				<Skeleton className="h-8 w-32" />
			</div>
			<div className="px-4 lg:px-6">
				<DataTableSkeleton columns={6} rows={10} />
			</div>
		</div>
	);
}
