import {
  IconMinus,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMeters, formatPercent, formatPeriod } from '@/lib/formatters';
import { AnalyticMetrics } from '@/schemas';

export interface IProps {
  data: AnalyticMetrics;
  period: 'three_months' | 'thirty_days' | 'seven_days';
}

export function AnalyticMetricCards({ data, period }: IProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Meters</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMeters(data.totalMeters.amount)}
          </CardTitle>
          <CardAction>
            <TrendingBadge change={data.totalMeters.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <TrendingMetersText change={data.totalMeters.change} />
          </div>
          <div className="text-muted-foreground">
            Meters for the last {formatPeriod(period)}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Workouts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.totalWorkouts.amount}
          </CardTitle>
          <CardAction>
            <TrendingBadge change={data.totalWorkouts.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendingWorkoutText change={data.totalWorkouts.change} />
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Challenge Points</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.totalPoints.amount}
          </CardTitle>
          <CardAction>
            <TrendingBadge change={data.totalPoints.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendingPointsText change={data.totalPoints.change} />
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Attendance Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatPercent(data.attendance.amount)}
          </CardTitle>
          <CardAction>
            <TrendingBadge change={data.attendance.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendingAttendanceText change={data.attendance.change} />
        </CardFooter>
      </Card>
    </div>
  );
}

const TrendingBadge = ({ change }: { change: number }) => {
  if (change > 0) {
    return (
      <Badge variant="outline">
        <IconTrendingUp />
        {formatPercent(change)}
      </Badge>
    );
  }
  if (change < 0) {
    return (
      <Badge variant="outline">
        <IconTrendingDown />
        {formatPercent(change)}
      </Badge>
    );
  }
  return <Badge variant="outline">{formatPercent(change)}</Badge>;
};

const TrendingIcon = ({ change }: { change: number }) => {
  if (change > 0) {
    return <IconTrendingUp className="size-4" />;
  }
  if (change < 0) {
    return <IconTrendingDown className="size-4" />;
  }
  return <IconMinus className="size-4" />;
};

const TrendingMetersText = ({ change }: { change: number }) => {
  if (change > 0) {
    return (
      <>
        Trending up this month <TrendingIcon change={change} />
      </>
    );
  }
  if (change < 0) {
    return (
      <>
        Trending down this month <TrendingIcon change={change} />
      </>
    );
  }
  return (
    <>
      No change this month <TrendingIcon change={change} />
    </>
  );
};

const TrendingWorkoutText = ({ change }: { change: number }) => {
  if (change > 0) {
    return (
      <>
        <div className="line-clamp-1 flex gap-2 font-medium">
          Up {formatPercent(change)} this period{' '}
          <IconTrendingDown className="size-4" />
        </div>
        <div className="text-muted-foreground">Great work out there!</div>
      </>
    );
  }
  if (change < 0) {
    return (
      <>
        <div className="line-clamp-1 flex gap-2 font-medium">
          Down{' '}
          {new Intl.NumberFormat('en-US', {
            style: 'percent',
            maximumFractionDigits: 1,
          }).format(Math.abs(change))}{' '}
          this period <IconTrendingDown className="size-4" />
        </div>
        <div className="text-muted-foreground">Attendance needs attention</div>
      </>
    );
  }
  return (
    <>
      <div className="line-clamp-1 flex gap-2 font-medium">
        No change this period <IconMinus className="size-4" />
      </div>
      <div className="text-muted-foreground">Attendance is steady</div>
    </>
  );
};

const TrendingPointsText = ({ change }: { change: number }) => {
  if (change > 0) {
    return (
      <>
        <div className="line-clamp-1 flex gap-2 font-medium">
          Strong athlete dedication <IconTrendingUp className="size-4" />
        </div>
        <div className="text-muted-foreground">Performance exceed targets</div>
      </>
    );
  }
  if (change < 0) {
    return (
      <>
        <div className="line-clamp-1 flex gap-2 font-medium">
          Keep working hard out there <IconTrendingDown className="size-4" />
        </div>
        <div className="text-muted-foreground">
          Performance could use improvement
        </div>
      </>
    );
  }
  return (
    <>
      <div className="line-clamp-1 flex gap-2 font-medium">
        No change this period <IconMinus className="size-4" />
      </div>
      <div className="text-muted-foreground">Performance is steady</div>
    </>
  );
};

const TrendingAttendanceText = ({ change }: { change: number }) => {
  if (change > 0) {
    return (
      <>
        <div className="line-clamp-1 flex gap-2 font-medium">
          Steady performance increase <IconTrendingUp className="size-4" />
        </div>
        <div className="text-muted-foreground">Meets growth projections</div>
      </>
    );
  }
  if (change < 0) {
    return (
      <>
        <div className="line-clamp-1 flex gap-2 font-medium">
          Steady performance decrease <IconTrendingDown className="size-4" />
        </div>
        <div className="text-muted-foreground">Below growth projections</div>
      </>
    );
  }
  return (
    <>
      <div className="line-clamp-1 flex gap-2 font-medium">
        No change this period <IconMinus className="size-4" />
      </div>
      <div className="text-muted-foreground">Attendance is steady</div>
    </>
  );
};
