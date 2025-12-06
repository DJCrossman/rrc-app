import { z } from "zod";

export const membershipTypes = ["membership", "coach", "admin"] as const;

export const ProgramType = ["masters", "juniors", "alumni"] as const;

const programSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string(),
	programType: z.enum(ProgramType),
	startDate: z.string(),
	endDate: z.string(),
});

export const createMembershipSchema = z.object({
	athleteId: z.number(),
	programId: z.number(),
});

export type CreateMembership = z.infer<typeof createMembershipSchema>;

export const membershipSchema = programSchema.and(createMembershipSchema);

export type Membership = z.infer<typeof membershipSchema>;

export const membershipsSchema = z.array(membershipSchema);

export type Memberships = z.infer<typeof membershipsSchema>;
