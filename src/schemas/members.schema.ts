import { z } from "zod";
import { withPagination } from "./pagination.schema";

export const InviteRoles = ["member", "admin"] as const;
export type InviteRole = (typeof InviteRoles)[number];

const MAX_INVITES = 50;

const emailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.pipe(z.email({ message: "Enter a valid email address" }));

export const getMembersInputSchema = withPagination({
	columns: ["name", "dateJoined"] as const,
}).extend({
	programIds: z.array(z.string()).optional(),
	isActive: z.boolean().optional(),
	search: z.string().trim().optional(),
});
export type GetMembersInput = z.infer<typeof getMembersInputSchema>;

export const inviteMembersSchema = z.object({
	emails: z
		.array(emailSchema)
		.min(1, { message: "Enter at least one email" })
		.max(MAX_INVITES, {
			message: `Invite at most ${MAX_INVITES} people at a time`,
		})
		.transform((emails) => [...new Set(emails)]),
	role: z.enum(InviteRoles),
});
export type InviteMembers = z.infer<typeof inviteMembersSchema>;

export const inviteMembersFormSchema = z.object({
	emails: z.string().transform((text, ctx) => {
		const entries = [
			...new Set(
				text
					.split(/[\s,;]+/)
					.map((entry) => entry.trim().toLowerCase())
					.filter(Boolean),
			),
		];
		if (entries.length === 0) {
			ctx.addIssue({ code: "custom", message: "Enter at least one email" });
			return z.NEVER;
		}
		const invalid = entries.filter(
			(entry) => !z.email().safeParse(entry).success,
		);
		if (invalid.length > 0) {
			ctx.addIssue({
				code: "custom",
				message: `Not valid emails: ${invalid.join(", ")}`,
			});
			return z.NEVER;
		}
		if (entries.length > MAX_INVITES) {
			ctx.addIssue({
				code: "custom",
				message: `Invite at most ${MAX_INVITES} people at a time`,
			});
			return z.NEVER;
		}
		return entries;
	}),
	role: z.enum(InviteRoles),
});
export type InviteMembersFormInput = z.input<typeof inviteMembersFormSchema>;
export type InviteMembersFormValues = z.output<typeof inviteMembersFormSchema>;

export const invitationIdSchema = z.object({ invitationId: z.string() });
export type InvitationIdInput = z.infer<typeof invitationIdSchema>;
