import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetersTimeSeriesChartSkeleton() {
	return (
		<Card className="@container/card">
			<CardHeader>
				<Skeleton className="h-5 w-40" />
				<Skeleton className="mt-2 h-4 w-56" />
				<CardAction>
					<Skeleton className="h-8 w-40" />
				</CardAction>
			</CardHeader>
			<CardContent>
				<Skeleton className="aspect-auto h-[250px] w-full" />
			</CardContent>
		</Card>
	);
}
