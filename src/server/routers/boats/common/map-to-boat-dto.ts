import type { boat as BoatRow } from "@/generated/prisma/client";
import type { ManufacturerType, RiggingType, SeatType } from "@/schemas";

export const convertWeightToKg = ({
	value,
	unit,
}: {
	value: number;
	unit: "kilogram" | "pound";
}) => (unit === "pound" ? Number((value * 0.453592).toFixed(2)) : value);

export const convertWeightFromKg = ({
	valueInKg,
	unit,
}: {
	valueInKg: number;
	unit: "kilogram" | "pound";
}) => (unit === "pound" ? Math.round(valueInKg * 2.20462) : valueInKg);

export const mapToBoatDto = ({
	boat,
	meters,
}: {
	boat: BoatRow;
	meters: number;
}) => {
	const unit = boat.preferredWeightUnit;
	return {
		id: boat.id,
		name: boat.name,
		manufacturer: boat.manufacturer as ManufacturerType,
		seats: boat.seats as SeatType,
		rigging: boat.rigging as RiggingType,
		weightRange: {
			min: convertWeightFromKg({ valueInKg: boat.weightMinKg, unit }),
			max: convertWeightFromKg({ valueInKg: boat.weightMaxKg, unit }),
			unit,
		},
		meters,
	};
};
