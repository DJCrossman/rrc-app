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
		<div className="grid grid-cols-2 gap-3 px-4 max-md:*:data-[slot=card]:gap-2 max-md:*:data-[slot=card]:py-3.5 max-md:**:data-[slot=card-header]:px-3.5 max-md:**:data-[slot=card-content]:px-3.5 max-md:**:data-[slot=card-footer]:px-3.5 md:gap-4 lg:px-6 @xl/main:grid-cols-4">
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
