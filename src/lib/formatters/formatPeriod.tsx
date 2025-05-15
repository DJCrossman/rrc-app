import { IProps } from '../../scenes/dashboard/DashboardScene/components/AnalyticMetricCards/AnalyticMetricCards';

export const formatPeriod = (period: IProps['period']) => {
  switch (period) {
    case 'three_months':
      return '3 months';
    case 'thirty_days':
      return '30 days';
    case 'seven_days':
      return '7 days';
    default:
      return 'unknown period';
  }
};
