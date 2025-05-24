import { DashboardScene } from '@/scenes/dashboard/DashboardScene';
import { getAnalytics } from './api/v1/analytics/actions';

export default async function HomePage() {
  const data = await getAnalytics();
  return <DashboardScene data={data} />;
}
