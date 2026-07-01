"use client";

import { type default as React, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { trpcClient } from "@/lib/trpc/client";
import {
	IntegrationAlert,
	LeaderboardTable,
	LeaderboardTableSkeleton,
	MetersTimeSeriesChart,
	MetersTimeSeriesChartSkeleton,
} from "@/scenes/dashboard/DashboardScene/components";
import { AnalyticMetricCards } from "@/scenes/dashboard/DashboardScene/components/AnalyticMetricCards/AnalyticMetricCards";
import { AnalyticMetricCardsSkeleton } from "@/scenes/dashboard/DashboardScene/components/AnalyticMetricCards/AnalyticMetricCardsSkeleton";

export const DashboardScene = () => {
	const [period, setPeriod] = useState<
		"three_months" | "thirty_days" | "seven_days"
	>("three_months");

	const analyticsQuery = trpcClient.analytics.getAnalytics.useQuery();
	const leaderboardQuery = trpcClient.analytics.getLeaderboard.useQuery();

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader breadcrumbs={[]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
							<IntegrationAlert />
							{analyticsQuery.isPending ? (
								<AnalyticMetricCardsSkeleton />
							) : analyticsQuery.data ? (
								<AnalyticMetricCards
									data={analyticsQuery.data.analyticMetrics}
								/>
							) : null}
							{analyticsQuery.isPending ? (
								<div className="px-4 lg:px-6">
									<MetersTimeSeriesChartSkeleton />
								</div>
							) : (
								analyticsQuery.data &&
								analyticsQuery.data.metersTimeSeries.length > 0 && (
									<div className="px-4 lg:px-6">
										<MetersTimeSeriesChart
											data={analyticsQuery.data.metersTimeSeries}
											timeRange={period}
											setTimeRange={setPeriod}
										/>
									</div>
								)
							)}
							{leaderboardQuery.isPending ? (
								<LeaderboardTableSkeleton />
							) : (
								<LeaderboardTable data={leaderboardQuery.data?.data ?? []} />
							)}
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};
