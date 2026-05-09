import type {
	ManufacturerType,
	SeatType,
	WeightUnitType,
} from "@/schemas/boat.schema";

export interface SuggestedWeightRange {
	min: number;
	max: number;
	unit: WeightUnitType;
}

type SuggestionMap = Partial<
	Record<ManufacturerType, Partial<Record<SeatType, SuggestedWeightRange>>>
>;

const lb = (min: number, max: number): SuggestedWeightRange => ({
	min,
	max,
	unit: "pound",
});

export const boatWeightSuggestions: SuggestionMap = {
	hudson: {
		"1": lb(30, 32),
		"2": lb(60, 66),
		"4": lb(110, 120),
		"8": lb(210, 230),
	},
	fluidesign: {
		"1": lb(30, 32),
		"2": lb(60, 66),
		"4": lb(110, 120),
		"8": lb(210, 230),
	},
	kaschper_racing_shells_ltd: {
		"1": lb(31, 33),
		"2": lb(60, 66),
		"4": lb(110, 120),
		"8": lb(210, 230),
	},
	liteboat_canada: {
		"1": lb(35, 40),
		"2": lb(70, 80),
	},
	lite_boat: {
		"1": lb(30, 35),
	},
	swift_racing_canada: {
		"1": lb(31, 33),
		"2": lb(60, 66),
		"4": lb(110, 120),
		"8": lb(210, 230),
	},
	whitehall_rowing_and_sail: {
		"1": lb(40, 55),
	},
	paluski_boats: {
		"1": lb(30, 33),
		"2": lb(60, 66),
		"4": lb(110, 120),
	},
};

export function getSuggestedWeightRange(
	manufacturer: ManufacturerType | undefined,
	seats: SeatType | undefined,
): SuggestedWeightRange | undefined {
	if (!manufacturer || !seats) return undefined;
	return boatWeightSuggestions[manufacturer]?.[seats];
}
