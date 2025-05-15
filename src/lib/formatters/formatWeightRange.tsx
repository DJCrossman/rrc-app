export const formatWeightRange = (weightRange: { min: number; max: number; unit: string }) => {
  const { min, max, unit } = weightRange;
  const unitFormatter = new Intl.NumberFormat('en-US', {
    style: 'unit',
    unit: unit,
    unitDisplay: 'short'
  });
  const formattedMin = unitFormatter.format(min);
  const formattedMax = unitFormatter.format(max);
  return `${formattedMin} - ${formattedMax}`;
}