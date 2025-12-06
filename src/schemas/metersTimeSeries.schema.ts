import { z } from "zod";

export const metersTimeSeriesSchema = z.array(
	z.object({
		date: z.string(),
		boat: z.number(),
		erg: z.number(),
	}),
);

export type MetersTimeSeries = z.infer<typeof metersTimeSeriesSchema>;
