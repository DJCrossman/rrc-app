import { baseProcedure, middleware, TRPCError } from "./trpc";

export const publicProcedure = baseProcedure;

const requireAuth = middleware(({ ctx, next }) => {
	if (!ctx.userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Unauthorized - Authentication required",
		});
	}
	return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
