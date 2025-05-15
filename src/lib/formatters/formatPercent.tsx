export const formatPercent = (percent: number) => {
  return [
    percent > 0 ? '+' : '',
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(percent),
  ]
    .filter(Boolean)
    .join('');
};
