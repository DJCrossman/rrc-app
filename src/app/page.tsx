import { DashboardScene } from '@/scenes/dashboard/DashboardScene';
import { Suspense, use } from 'react';
import { getAnalytics } from './api/v1/analytics/actions';

export default function HomePage() {
  const data = use(getAnalytics());
  return (
    <Suspense>
      <DashboardScene data={data} />
    </Suspense>
  );
}
