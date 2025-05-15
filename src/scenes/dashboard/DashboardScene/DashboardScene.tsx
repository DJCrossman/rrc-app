'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AnalyticMetricCards } from '@/scenes/dashboard/DashboardScene/components/AnalyticMetricCards/AnalyticMetricCards';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  LeaderboardTable,
  MetersTimeSeriesChart,
} from '@/scenes/dashboard/DashboardScene/components';
import { AnalyticMetrics, Leaderboard, MetersTimeSeries } from '@/schemas';
import { default as React, useState } from 'react';

interface IProps {
  data: {
    analyticMetrics: AnalyticMetrics;
    metersTimeSeries: MetersTimeSeries;
    leaderboard: Leaderboard;
  };
}

export const DashboardScene = ({ data }: IProps) => {
  const [period, setPeriod] = useState<
    'three_months' | 'thirty_days' | 'seven_days'
  >('three_months');
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <AnalyticMetricCards data={data.analyticMetrics} period={period} />
              <div className="px-4 lg:px-6">
                <MetersTimeSeriesChart
                  data={data.metersTimeSeries}
                  timeRange={period}
                  setTimeRange={setPeriod}
                />
              </div>
              <LeaderboardTable data={data.leaderboard} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
