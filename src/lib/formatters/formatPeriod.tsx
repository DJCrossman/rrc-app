export const formatPeriod = (
	period: "three_months" | "thirty_days" | "seven_days",
) => {
	switch (period) {
		case "three_months":
			return "3 months";
		case "thirty_days":
			return "30 days";
		case "seven_days":
			return "7 days";
		default:
			return "unknown period";
	}
};
