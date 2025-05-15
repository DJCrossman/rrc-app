import { z } from "zod";

export const boatSchema = z.object({
  id: z.number(),
  name: z.string(),
  manufacturer: z.string(),
  seats: z.enum(["1", "2", "4", "8"]),
  rigging: z.enum(["sculling", "sweep"]),
  weightRange: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.enum(["kilogram", "pound"]),
  }),
  meters: z.number(),
})

export type Boat = z.infer<typeof boatSchema>

export const boatsSchema = z.array(
  boatSchema
)

export type Boats = z.infer<typeof boatsSchema>