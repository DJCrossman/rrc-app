import { z } from "zod";

export const ManufacturerTypes = [
	"hudson",
	"fluidesign",
	"kaschper_racing_shells_ltd",
	"liteboat_canada",
	"swift_racing_canada",
	"whitehall_rowing_and_sail",
	"paluski_boats",
] as const;
export type ManufacturerType = (typeof ManufacturerTypes)[number];

export const SeatTypes = ["1", "2", "4", "8"] as const;
export type SeatType = (typeof SeatTypes)[number];

export const RiggingTypes = ["sculling", "sweep"] as const;
export type RiggingType = (typeof RiggingTypes)[number];

export const WeightUnitTypes = ["kilogram", "pound"] as const;
export type WeightUnitType = (typeof WeightUnitTypes)[number];

export const createBoatSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	manufacturer: z.enum(ManufacturerTypes),
	seats: z.enum(SeatTypes),
	rigging: z.enum(RiggingTypes),
	weightRange: z.object({
		min: z.number(),
		max: z.number(),
		unit: z.enum(WeightUnitTypes),
	}),
});

export type CreateBoat = z.infer<typeof createBoatSchema>;
