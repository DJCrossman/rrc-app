export const formatMeters = (meters: number) => {
	if (meters >= 100000) {
		const kilometers = meters / 1000;
		return new Intl.NumberFormat("en-US", {
			style: "unit",
			unit: "kilometer",
			unitDisplay: "short",
			maximumFractionDigits: 1,
			minimumFractionDigits: 1,
		}).format(kilometers);
	}
	return new Intl.NumberFormat("en-US", {
		style: "unit",
		unit: "meter",
		unitDisplay: "short",
		maximumFractionDigits: 0,
	}).format(meters);
};
