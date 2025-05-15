export const formatMeters = (meters: number) => {
  if (meters > 1000) {
    meters = Math.round(meters / 1000);
    return new Intl.NumberFormat('en-US', {
      style: 'unit',
      unit: 'kilometer',
      unitDisplay: 'short',
    }).format(meters);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'unit',
    unit: 'meter',
    unitDisplay: 'short',
  }).format(meters);
};
