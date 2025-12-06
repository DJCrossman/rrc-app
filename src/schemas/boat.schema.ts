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

export const SeatTypes = ["1", "2", "4", "8"] as const;

export const RiggingTypes = ["sculling", "sweep"] as const;

export const WeightUnitTypes = ["kilogram", "pound"] as const;

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

export const boatSchema = createBoatSchema.extend({
	id: z.number(),
	meters: z.number(),
});

export type Boat = z.infer<typeof boatSchema>;

export const boatsSchema = z.array(boatSchema);

export type Boats = z.infer<typeof boatsSchema>;
