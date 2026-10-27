// Distances are stored and entered in metres. Anything past a kilometre reads
// better in kilometres, and planning totals run to hundreds or thousands of
// them, so those switch to compact notation (1.4K km) rather than overflowing.
export const formatDistance = (meters: number) => {
	if (Math.abs(meters) < 1000) {
		return new Intl.NumberFormat("en-US", {
			style: "unit",
			unit: "meter",
			unitDisplay: "short",
			maximumFractionDigits: 0,
		}).format(meters);
	}
	return new Intl.NumberFormat("en-US", {
		style: "unit",
		unit: "kilometer",
		unitDisplay: "short",
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(meters / 1000);
};
