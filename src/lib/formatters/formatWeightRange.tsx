import type { Boat } from "@/schemas";

const getUnitFormatter = (unit: Boat["weightRange"]["unit"]) => {
	return new Intl.NumberFormat("en-US", {
		style: "unit",
		unit: unit,
		unitDisplay: "short",
	});
};

export const formatWeight = (weightRange: {
	value: Boat["weightRange"]["min"] | Boat["weightRange"]["max"];
	unit: Boat["weightRange"]["unit"];
}) => {
	const { value, unit } = weightRange;
	const unitFormatter = getUnitFormatter(unit);
	return unitFormatter.format(value);
};

export const formatWeightRange = (weightRange: Boat["weightRange"]) => {
	const { min, max, unit } = weightRange;
	const unitFormatter = new Intl.NumberFormat("en-US", {
		style: "unit",
		unit: unit,
		unitDisplay: "short",
	});
	const formattedMin = unitFormatter.format(min);
	const formattedMax = unitFormatter.format(max);
	return `${formattedMin} - ${formattedMax}`;
};
