'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsMobile } from '@/hooks/use-mobile';
import { MetersTimeSeries } from '@/schemas';
import { useEffect } from 'react';

export const description = 'An interactive area chart';

const chartConfig: Record<
  keyof Omit<MetersTimeSeries[number], 'date'> | 'meters',
  ChartConfig[string]
> = {
  meters: {
    label: 'Meters',
  },
  boat: {
    label: 'Boat',
    color: 'var(--primary)',
  },
  erg: {
    label: 'ERG',
    color: 'var(--primary)',
  },
};

interface IProps {
  data: MetersTimeSeries;
  timeRange: 'three_months' | 'thirty_days' | 'seven_days';
  setTimeRange: (value: 'three_months' | 'thirty_days' | 'seven_days') => void;
}

export function MetersTimeSeriesChart({
  data: chartData,
  timeRange,
  setTimeRange,
}: IProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setTimeRange('seven_days');
    }
  }, [isMobile, setTimeRange]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date('2024-06-30');
    let daysToSubtract = 90;
    if (timeRange === 'thirty_days') {
      daysToSubtract = 30;
    } else if (timeRange === 'seven_days') {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Meters</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="three_months">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="thirty_days">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="seven_days">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="three_months" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="thirty_days" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="seven_days" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillBoat" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-boat)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-boat)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-erg)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-erg)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="erg"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-erg)"
              stackId="a"
            />
            <Area
              dataKey="boat"
              type="natural"
              fill="url(#fillBoat)"
              stroke="var(--color-boat)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
