import {
	Activity,
	Clock,
	Flame,
	Navigation,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { DateTime } from "luxon";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { formatDuration, formatMeters, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AnalyticMetrics } from "@/schemas";

export interface IProps {
	data: AnalyticMetrics;
}

export function AnalyticMetricCards({ data }: IProps) {
	return (
		<div className="grid grid-cols-2 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card lg:px-6 @xl/main:grid-cols-4">
			<Card className="@container/card flex-1 min-w-[calc(50%-0.375rem)] @xl/main:min-w-[calc(25%-0.75rem)]">
				<CardHeader>
					<CardDescription>Active Streak</CardDescription>
					<CardAction>
						<div className="flex items-center gap-1.5">
							<Flame className="size-4 text-red-400" />
						</div>
					</CardAction>
				</CardHeader>
				<CardContent className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{data.activeStreak.currentStreak}{" "}
					{data.activeStreak.currentStreak === 1 ? "week" : "weeks"}
				</CardContent>
				<CardFooter className="flex-col items-start gap-2 text-sm">
					<div className="grid grid-cols-7 gap-1.5 w-full">
						{data.activeStreak.weekDays.map((day) => {
							const date = DateTime.fromISO(day.date);
							return (
								<div
									key={day.date}
									className="flex flex-col items-center gap-1"
								>
									<div className="text-xs text-muted-foreground font-medium">
										{date.toFormat("ccc")}
									</div>
									<div
										className={cn(
											"size-4 rounded-sm flex items-center justify-center text-[10px] font-semibold",
											day.hasActivity
												? "bg-red-400/20 text-red-600 dark:text-red-400"
												: "bg-muted text-muted-foreground",
										)}
									>
										{day.hasActivity ? (
											<Flame className="size-3" />
										) : (
											<span>{date.day}</span>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</CardFooter>
			</Card>
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Total Distance</CardDescription>
					<CardAction>
						<TrendingBadge change={data.totalMeters.change} />
					</CardAction>
				</CardHeader>
				<CardContent className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{formatMeters(data.totalMeters.amount)}
				</CardContent>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="text-muted-foreground flex items-center gap-1.5">
						<Navigation className="size-4" />
						<span>This week</span>
					</div>
				</CardFooter>
			</Card>
			<Card className="@container/card flex-1 min-w-[calc(50%-0.375rem)] @xl/main:min-w-[calc(25%-0.75rem)]">
				<CardHeader>
					<CardDescription>Total Activities</CardDescription>
					<CardAction>
						<TrendingBadge change={data.totalActivities.change} />
					</CardAction>
				</CardHeader>
				<CardContent className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{data.totalActivities.amount}
				</CardContent>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="text-muted-foreground flex items-center gap-1.5">
						<Activity className="size-4" />
						<span>This week</span>
					</div>
				</CardFooter>
			</Card>
			<Card className="@container/card flex-1 min-w-[calc(50%-0.375rem)] @xl/main:min-w-[calc(25%-0.75rem)]">
				<CardHeader>
					<CardDescription>Total Duration</CardDescription>
					<CardAction>
						<TrendingBadge change={data.totalDuration.change} />
					</CardAction>
				</CardHeader>
				<CardContent className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{formatDuration(data.totalDuration.amount)}
				</CardContent>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="text-muted-foreground flex items-center gap-1.5">
						<Clock className="size-4" />
						<span>This week</span>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

const TrendingBadge = ({ change }: { change: number }) => {
	if (change > 0) {
		return (
			<Badge variant="outline">
				<TrendingUp className="size-3.5" />
				{formatPercent(change)}
			</Badge>
		);
	}
	if (change < 0) {
		return (
			<Badge variant="outline">
				<TrendingDown className="size-3.5" />
				{formatPercent(change)}
			</Badge>
		);
	}
	return <Badge variant="outline">{formatPercent(change)}</Badge>;
};
