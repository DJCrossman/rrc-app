import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CARD_KEYS = ["streak", "distance", "metric", "duration"];

export function AnalyticMetricCardsSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-4 px-4 lg:px-6 @xl/main:grid-cols-4">
			{CARD_KEYS.map((key) => (
				<Card key={key} className="@container/card">
					<CardHeader>
						<Skeleton className="h-4 w-24" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-8 w-28" />
					</CardContent>
					<CardFooter>
						<Skeleton className="h-4 w-full" />
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
