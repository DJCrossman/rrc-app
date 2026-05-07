import { z } from "zod";

export const rcaMembershipItemSchema = z
	.object({
		Id: z.union([z.number(), z.string()]).optional(),
		MembershipId: z.union([z.number(), z.string()]).optional(),
		ProgramId: z.union([z.number(), z.string()]).optional(),
		PolicyId: z.union([z.number(), z.string()]).optional(),
		RegistrationId: z.union([z.number(), z.string()]).optional(),
		Name: z.string().optional(),
		MembershipType: z.string().optional(),
		MembershipName: z.string().optional(),
		ProgramName: z.string().optional(),
		Organization: z.string().optional(),
		Status: z.string().optional(),
		StartDate: z.string().optional(),
		EndDate: z.string().optional(),
		ExpiryDate: z.string().optional(),
		// OrgMemberships_Read shape
		organization_category_membership_id: z
			.union([z.number(), z.string()])
			.optional(),
		category_id: z.union([z.number(), z.string()]).optional(),
		category_name: z.string().optional(),
		category_description: z.string().optional(),
		category_start_date: z.string().optional(),
		category_end_date: z.string().optional(),
		membership_effective_date: z.string().optional(),
		membership_end_date: z.string().optional(),
		ocm_status_code: z.string().optional(),
		ocm_status_name: z.string().optional(),
		organization_name: z.string().optional(),
		// NonClubMemberships_Read / MembershipsByPartyRoleType_Read shape
		party_relationship_id: z.union([z.number(), z.string()]).optional(),
		party_relationship_type_name: z.string().optional(),
		effective_date: z.string().optional(),
		end_date: z.string().optional(),
		status_type_code: z.string().optional(),
		status_type_name: z.string().optional(),
		organization_name_to: z.string().nullable().optional(),
		organization_abbr_to: z.string().nullable().optional(),
		party_role_type_name_to: z.string().nullable().optional(),
		party_role_type_code_to: z.string().nullable().optional(),
	})
	.passthrough();

export const rcaMembershipsResponseSchema = z
	.object({
		Data: z.array(rcaMembershipItemSchema).optional(),
		Total: z.number().optional(),
	})
	.passthrough();

export type RcaMembershipItem = z.infer<typeof rcaMembershipItemSchema>;

export function pickRcaProgramExternalId(
	item: RcaMembershipItem,
): string | null {
	const raw =
		item.category_id ??
		item.ProgramId ??
		item.PolicyId ??
		item.RegistrationId ??
		item.MembershipId ??
		item.Id;
	return raw == null ? null : String(raw);
}

export function pickRcaProgramName(item: RcaMembershipItem): string | null {
	const candidate =
		item.category_name ||
		(item.party_relationship_type_name
			? formatRelationshipName(
					item.party_relationship_type_name,
					item.organization_abbr_to ?? null,
				)
			: null) ||
		item.ProgramName ||
		item.MembershipName ||
		item.MembershipType ||
		item.Name ||
		(typeof (item as Record<string, unknown>).Title === "string"
			? ((item as Record<string, unknown>).Title as string)
			: null) ||
		(typeof (item as Record<string, unknown>).Category === "string"
			? ((item as Record<string, unknown>).Category as string)
			: null);
	return candidate ? String(candidate).trim() : null;
}

export function pickRcaProgramDescription(
	item: RcaMembershipItem,
): string | null {
	const candidate =
		item.category_description ??
		(typeof (item as Record<string, unknown>).Description === "string"
			? ((item as Record<string, unknown>).Description as string)
			: null);
	return candidate ? String(candidate).trim() : null;
}

export function pickRcaProgramStartDate(item: RcaMembershipItem): Date | null {
	return (
		parseRcaDate(item.category_start_date) ??
		parseRcaDate(item.membership_effective_date) ??
		parseRcaDate(item.effective_date) ??
		parseRcaDate(item.StartDate)
	);
}

export function pickRcaProgramEndDate(item: RcaMembershipItem): Date | null {
	return (
		parseRcaDate(item.category_end_date) ??
		parseRcaDate(item.membership_end_date) ??
		parseRcaDate(item.end_date) ??
		parseRcaDate(item.EndDate) ??
		parseRcaDate(item.ExpiryDate)
	);
}

export function pickRcaOrganizationName(
	item: RcaMembershipItem,
): string | null {
	if (item.Organization) return String(item.Organization).trim();
	if (item.organization_name) return String(item.organization_name).trim();
	if (item.organization_name_to)
		return String(item.organization_name_to).trim();
	const orgFields = ["OrganizationName", "Org", "ClubName", "Club"] as const;
	for (const f of orgFields) {
		const v = (item as Record<string, unknown>)[f];
		if (typeof v === "string" && v.trim()) return v.trim();
	}
	return null;
}

function formatRelationshipName(
	relationship: string,
	orgAbbr: string | null,
): string {
	const words = relationship.split(/\s+/).filter(Boolean);
	const titleCase = (s: string) =>
		s.length === 0 ? s : s[0].toUpperCase() + s.slice(1).toLowerCase();
	if (orgAbbr && words.length > 0) {
		const role = titleCase(words[words.length - 1]);
		return `${orgAbbr} ${role}`;
	}
	return words.map(titleCase).join(" ");
}

export function normalizeRcaText(s: string | null): string {
	if (!s) return "";
	return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function makeRcaProgramSignature(
	item: RcaMembershipItem,
): string | null {
	const name = normalizeRcaText(pickRcaProgramName(item));
	if (!name) return null;
	const org = normalizeRcaText(pickRcaOrganizationName(item));
	return `${name}|${org}`;
}

export function pickRcaMembershipId(item: RcaMembershipItem): string | null {
	const raw = item.Id ?? item.MembershipId;
	return raw == null ? null : String(raw);
}

export function pickRcaMembershipName(item: RcaMembershipItem): string {
	return (
		item.MembershipName ||
		item.MembershipType ||
		item.Name ||
		item.Organization ||
		"RCA Membership"
	);
}

export function parseRcaDate(value: string | undefined): Date | null {
	if (!value) return null;
	const aspNet = value.match(/\/Date\((\d+)\)\//);
	if (aspNet) {
		return new Date(Number(aspNet[1]));
	}
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}
