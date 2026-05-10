import { athleteInclude } from "@/server/routers/athletes/common/map-to-athlete-dto";
import { middleware, TRPCError } from "../trpc";

export const requireAuthAndAthlete = middleware(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}
	const athlete = await ctx.db.athlete.findUnique({
		where: { userId: ctx.user.id },
		include: athleteInclude,
	});
	if (!athlete) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Athlete account required",
		});
	}
	return next({ ctx: { ...ctx, user: ctx.user, athlete } });
});

export const requireAuthAndAdmin = middleware(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}
	if (!ctx.user.isAdmin) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Admin access required",
		});
	}
	const athlete = await ctx.db.athlete.findUnique({
		where: { userId: ctx.user.id },
		include: athleteInclude,
	});
	return next({
		ctx: {
			...ctx,
			user: { ...ctx.user, isAdmin: true as const },
			athlete,
		},
	});
});

export const requireAuthAndNoAthlete = middleware(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}
	const existing = await ctx.db.athlete.findUnique({
		where: { userId: ctx.user.id },
		select: { id: true },
	});
	if (existing) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "Athlete account already exists",
		});
	}
	return next({
		ctx: { ...ctx, user: ctx.user, athlete: null as null },
	});
});
