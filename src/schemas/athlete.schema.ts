import { z } from "zod";
import { membershipSchema } from "./memberships.schema";
import { phoneNumberSchema } from "./phoneNumber.schema";

export const UserRoles = ["admin", "member"] as const;
export type UserRole = (typeof UserRoles)[number];

export const GenderTypes = ["male", "female", "nonbinary"] as const;

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

export const athleteDBSchema = z.object({
	id: z.number(),
	clerkUserId: z.string().optional(),
	role: z.enum(UserRoles).default("member"),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	nickname: z.string().optional(),
	membershipIds: z.array(z.number()),
});

export type AthleteDB = z.infer<typeof athleteDBSchema>;

export const ProgramTypes = ["masters", "juniors", "alumni"] as const;

export const createAthleteSchema = athleteProfileSchema.extend({
	programId: z.string().optional(),
});

export type CreateAthlete = z.infer<typeof createAthleteSchema>;

export const athleteSchema = athleteProfileSchema.extend({
	id: z.number(),
	userId: z.number(),
	name: z.string(),
	role: z.enum(UserRoles).default("member"),
	activeMembership: membershipSchema.optional(),
	programType: z.enum(ProgramTypes).optional(),
});

export type Athlete = z.infer<typeof athleteSchema>;

export const athletesSchema = z.array(athleteSchema);

export type Athletes = z.infer<typeof athletesSchema>;

export const currentAthleteSchema = athleteSchema.extend({
	concept2Connected: z.boolean().default(false),
	concept2UserId: z.number().optional(),
	stravaConnected: z.boolean().default(false),
	stravaAthleteId: z.string().optional(),
});

export type CurrentAthlete = z.infer<typeof currentAthleteSchema>;

export const currentAthletesSchema = z.array(currentAthleteSchema);

export const updateAthleteSchema = athleteProfileSchema.extend({
	id: z.number(),
});

export type UpdateAthlete = z.infer<typeof updateAthleteSchema>;

export interface AthleteStats {
	lastTwoKmRaceDuration?: {
		duration: number;
		date: string;
		activityId: number;
	};
	bestTwoKmRaceDuration?: {
		duration: number;
		date: string;
		activityId: number;
	};
	lastSixKmRaceDuration?: {
		duration: number;
		date: string;
		activityId: number;
	};
	bestSixKmRaceDuration?: {
		duration: number;
		date: string;
		activityId: number;
	};
}
