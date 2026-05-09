import { TRPCError } from "@trpc/server";
import { createLogger } from "@/lib/logger";
import {
	makeRcaProgramSignature,
	normalizeRcaText,
	pickRcaOrganizationName,
	pickRcaProgramDescription,
	pickRcaProgramEndDate,
	pickRcaProgramExternalId,
	pickRcaProgramName,
	pickRcaProgramStartDate,
	type RcaMembershipItem,
} from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import { RcaSessionExpiredError } from "@/server/services/rca-service";
import {
	clearRcaCredentials,
	getRcaSession,
} from "../../common/get-rca-session";

const logger = createLogger("sync-rca");

type Source = "program" | "organization" | "participant";

type DbClient = AuthenticatedContext["db"];
type ProgramRow = Awaited<ReturnType<DbClient["program"]["findFirst"]>>;

export async function syncRcaCommand(
	_input: undefined,
	ctx: AuthenticatedContext,
) {
	const { db, services, userId } = ctx;
	const athlete = await db.athlete.findUnique({ where: { userId } });
	if (!athlete) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Athlete profile not found",
		});
	}

	const session = await getRcaSession(ctx);
	if (!session) {
		await clearRcaCredentials(ctx);
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message:
				"RCA is not connected or credentials are invalid. Please reconnect.",
		});
	}

	const settled = await Promise.allSettled([
		services.rca.fetchProgramMemberships(session),
		services.rca.fetchOrganizationMemberships(session),
		services.rca.fetchParticipantMemberships(session),
	]);

	const sources: Source[] = ["program", "organization", "participant"];
	for (const [i, result] of settled.entries()) {
		if (result.status === "rejected") {
			if (result.reason instanceof RcaSessionExpiredError) {
				await clearRcaCredentials(ctx);
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "RCA session expired. Please reconnect.",
				});
			}
			logger.warn("membership endpoint failed", {
				source: sources[i],
				error: String(result.reason),
			});
		}
	}

	const items = settled.flatMap((r) =>
		r.status === "fulfilled" ? r.value : [],
	);

	const allPrograms = await db.program.findMany();
	const sigCache = new Map<string, ProgramRow>();
	const nameCache = new Map<string, ProgramRow>();
	for (const p of allPrograms) {
		const normName = normalizeRcaText(p.name);
		const sig = `${normName}|${normalizeRcaText(p.organizationName)}`;
		if (normName) {
			sigCache.set(sig, p);
			if (!nameCache.has(normName)) nameCache.set(normName, p);
		}
	}

	const seenPrograms = new Set<string>();
	const seenMemberships = new Set<string>();
	let skipped = 0;
	const now = new Date();
	let earliestMembershipStart: Date | null = null;

	for (const item of items) {
		const program = await getOrCreateProgram(
			item,
			db,
			sigCache,
			nameCache,
			now,
		);
		if (!program) {
			skipped += 1;
			logger.warn("RCA item: no usable identifier", {
				itemSummary: summarizeItem(item),
			});
			continue;
		}
		seenPrograms.add(program.id);

		const itemStart = pickRcaProgramStartDate(item);
		if (
			itemStart &&
			(!earliestMembershipStart || itemStart < earliestMembershipStart)
		) {
			earliestMembershipStart = itemStart;
		}

		await db.membership.upsert({
			where: {
				athleteId_programId: {
					athleteId: athlete.id,
					programId: program.id,
				},
			},
			create: { athleteId: athlete.id, programId: program.id },
			update: {},
		});
		seenMemberships.add(`${athlete.id}_${program.id}`);
	}

	let updatedDateJoined: Date | null = athlete.dateJoined;
	if (earliestMembershipStart) {
		const newDateJoined =
			athlete.dateJoined && athlete.dateJoined < earliestMembershipStart
				? athlete.dateJoined
				: earliestMembershipStart;
		if (newDateJoined.getTime() !== athlete.dateJoined?.getTime()) {
			await db.athlete.update({
				where: { id: athlete.id },
				data: { dateJoined: newDateJoined },
			});
			updatedDateJoined = newDateJoined;
		}
	}

	logger.info("RCA sync done", {
		totalItems: items.length,
		uniquePrograms: seenPrograms.size,
		memberships: seenMemberships.size,
		skipped,
		earliestMembershipStart,
		dateJoined: updatedDateJoined,
	});

	return {
		programs: { upserted: seenPrograms.size },
		memberships: {
			upserted: seenMemberships.size,
			skipped,
			total: items.length,
		},
	};
}

async function getOrCreateProgram(
	item: RcaMembershipItem,
	db: DbClient,
	sigCache: Map<string, ProgramRow>,
	nameCache: Map<string, ProgramRow>,
	now: Date,
): Promise<ProgramRow> {
	const name = pickRcaProgramName(item);
	const organizationName = pickRcaOrganizationName(item);
	const description = pickRcaProgramDescription(item);
	const startDate = pickRcaProgramStartDate(item);
	const endDate = pickRcaProgramEndDate(item);
	const signature = makeRcaProgramSignature(item);
	const externalIdFromItem = pickRcaProgramExternalId(item);

	if (signature && sigCache.has(signature)) {
		return sigCache.get(signature) ?? null;
	}

	const normName = normalizeRcaText(name);
	if (normName && nameCache.has(normName)) {
		const matched = nameCache.get(normName) ?? null;
		if (matched && signature) sigCache.set(signature, matched);
		return matched;
	}

	const externalId =
		externalIdFromItem ?? (signature ? `synth:${signature}` : null);
	if (!externalId) return null;

	const program = await db.program.upsert({
		where: { rcaProgramId: externalId },
		create: {
			rcaProgramId: externalId,
			rcaOrgId: null,
			organizationName,
			name: name ?? "RCA Program",
			description,
			startDate,
			endDate,
			syncedAt: now,
		},
		update: {
			organizationName,
			name: name ?? "RCA Program",
			description,
			startDate,
			endDate,
			syncedAt: now,
		},
	});

	if (signature) sigCache.set(signature, program);
	if (normName) nameCache.set(normName, program);
	return program;
}

function summarizeItem(item: RcaMembershipItem): Record<string, unknown> {
	return {
		category_id: item.category_id,
		category_name: item.category_name,
		Id: item.Id,
		ProgramId: item.ProgramId,
		Organization: item.Organization,
		organization_name: item.organization_name,
		keys: Object.keys(item),
	};
}
