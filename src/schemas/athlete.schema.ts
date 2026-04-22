import { z } from "zod";
import { phoneNumberSchema } from "./phoneNumber.schema";

export const UserRoles = ["admin", "member"] as const;
export type UserRole = (typeof UserRoles)[number];

export const GenderTypes = ["male", "female", "nonbinary"] as const;

export const ProgramTypes = ["masters", "juniors", "alumni"] as const;

export const athleteProfileSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	nickname: z.string().optional(),
	phone: phoneNumberSchema,
	email: z.email().optional(),
	dateJoined: z
		.string()
		.refine((date) => new Date(date) <= new Date(), {
			message: "Date joined must be in the past",
		})
		.optional(),
	gender: z.enum(GenderTypes),
	dateOfBirth: z.string().refine((date) => new Date(date) <= new Date(), {
		message: "Date of birth must be in the past",
	}),
	heightInCm: z.number().optional(),
	weightInKg: z.number().optional(),
});

export const createAthleteSchema = athleteProfileSchema.extend({
	programId: z.string().optional(),
});

export type CreateAthlete = z.infer<typeof createAthleteSchema>;

export const updateAthleteSchema = athleteProfileSchema.extend({
	id: z.string(),
});

export type UpdateAthlete = z.infer<typeof updateAthleteSchema>;

export interface AthleteStats {
	lastTwoKmRaceDuration?: {
		duration: number;
		date: string;
		activityId: string;
	};
	bestTwoKmRaceDuration?: {
		duration: number;
		date: string;
		activityId: string;
	};
	lastSixKmRaceDuration?: {
		duration: number;
		date: string;
		activityId: string;
	};
	bestSixKmRaceDuration?: {
		duration: number;
		date: string;
		activityId: string;
	};
}
