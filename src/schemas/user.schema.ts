import { z } from "zod";
import { phoneNumberSchema } from "./phoneNumber.schema";

export const UserRoles = ["admin", "coach", "athlete"] as const;

export const GenderTypes = ["male", "female", "nonbinary"] as const;

export const baseUserSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	nickName: z.string().optional(),
	phone: phoneNumberSchema,
	roles: z.array(z.enum(UserRoles)).min(1),
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

export const userSchema = baseUserSchema.extend({
	id: z.number(),
});

export type User = z.infer<typeof userSchema>;
export type UserRole = User["roles"][number];

export const usersSchema = z.array(userSchema);
