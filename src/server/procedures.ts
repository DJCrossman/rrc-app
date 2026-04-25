import {
	TRPCError,
	type TRPCMutationProcedure,
	type TRPCQueryProcedure,
} from "@trpc/server";
import { after as nextAfter } from "next/server";
import type { z } from "zod";
import { createLogger } from "@/lib/logger";
import type { AuthenticatedContext, Context } from "./context";
import { baseProcedure, middleware } from "./trpc";

const afterLogger = createLogger("procedure.after");

type Handler<TContext, TInput, TResult> = (opts: {
	ctx: TContext;
	input: TInput;
}) => Promise<TResult> | TResult;

export type FinalizeCallback<TContext, TInput, TResult> = (args: {
	ctx: TContext;
	input: TInput;
	result: PromiseSettledResult<TResult>;
}) => void | Promise<void>;

/**
 * Configuration object for `.mutation(...)` / `.query(...)`.
 *
 * - `handler` is the procedure's normal resolver. Its return type is the
 *   procedure's output and flows into `after`'s `result` parameter.
 * - `finalize` (optional) runs AFTER the response is flushed to the client.
 *   Wraps Next.js `after()` (awaited by Vercel's `waitUntil`). The handler's
 *   outcome is passed as a `PromiseSettledResult`, so finalize can react to
 *   both success and failure (e.g. mark a record as failed when the handler
 *   throws). Throwing inside `finalize` itself is logged to scope
 *   `procedure.finalize` and never bubbles to the client.
 *
 * Both functions receive properly-typed `ctx`, `input`, and (for `finalize`)
 * `result` — no generics need to be passed at the call site.
 *
 * @example
 * export const sendInviteProcedure = protectedProcedure
 *   .input(z.object({ email: z.string().email() }))
 *   .mutation({
 *     handler: ({ ctx, input }) => createInvite(input, ctx),
 *     finalize: async ({ ctx, input, result }) => {
 *       if (result.status !== "fulfilled") return;
 *       await sendInviteEmail({ to: input.email, inviteId: result.value.id });
 *     },
 *   });
 */
type ResolveConfig<TContext, TInput, TResult> = {
	handler: Handler<TContext, TInput, TResult>;
	finalize?: FinalizeCallback<TContext, TInput, TResult>;
};

type ResolveArg<TContext, TInput, TResult> =
	| Handler<TContext, TInput, TResult>
	| ResolveConfig<TContext, TInput, TResult>;

type AfterableBuilder<TContext, TInput> = {
	input<TSchema extends z.ZodType>(
		schema: TSchema,
	): AfterableBuilder<TContext, z.infer<TSchema>>;
	use(
		mw: Parameters<typeof baseProcedure.use>[0],
	): AfterableBuilder<TContext, TInput>;
	mutation<TResult>(
		arg: ResolveArg<TContext, TInput, TResult>,
	): TRPCMutationProcedure<{ meta: object; input: TInput; output: TResult }>;
	query<TResult>(
		arg: ResolveArg<TContext, TInput, TResult>,
	): TRPCQueryProcedure<{ meta: object; input: TInput; output: TResult }>;
};

function scheduleAfter<TContext, TInput, TResult>(
	handler: Handler<TContext, TInput, TResult>,
	fn: FinalizeCallback<TContext, TInput, TResult>,
): Handler<TContext, TInput, TResult> {
	return async (args) => {
		const [result] = await Promise.allSettled([handler(args)]);
		nextAfter(async () => {
			try {
				await fn({ ctx: args.ctx, input: args.input, result });
			} catch (err) {
				afterLogger.error("callback threw", {
					error: err instanceof Error ? err.message : String(err),
				});
			}
		});
		if (result.status === "rejected") throw result.reason;
		return result.value;
	};
}

// Internal helper: wraps a tRPC builder so its `.mutation()` and `.query()`
// take a `ResolveConfig` (handler + optional after) and forward to tRPC's
// underlying builder. The inner builder is typed broadly with `any` because
// tRPC's `ProcedureBuilder` has eight generic parameters that change on
// every chain step; the public types above do all the constraint work.
function wrapBuilder<TContext, TInput>(
	// biome-ignore lint/suspicious/noExplicitAny: tRPC's builder has 8 generics that change per chain step; runtime safety comes from tRPC itself.
	builder: any,
): AfterableBuilder<TContext, TInput> {
	return {
		input<TSchema extends z.ZodType>(schema: TSchema) {
			return wrapBuilder<TContext, z.infer<TSchema>>(builder.input(schema));
		},
		use(mw) {
			return wrapBuilder<TContext, TInput>(builder.use(mw));
		},
		mutation<TResult>(arg: ResolveArg<TContext, TInput, TResult>) {
			const config: ResolveConfig<TContext, TInput, TResult> =
				typeof arg === "function" ? { handler: arg } : arg;
			const handler = config.finalize
				? scheduleAfter(config.handler, config.finalize)
				: config.handler;
			return builder.mutation(handler);
		},
		query<TResult>(arg: ResolveArg<TContext, TInput, TResult>) {
			const config: ResolveConfig<TContext, TInput, TResult> =
				typeof arg === "function" ? { handler: arg } : arg;
			const handler = config.finalize
				? scheduleAfter(config.handler, config.finalize)
				: config.handler;
			return builder.query(handler);
		},
	};
}

const requireAuth = middleware(({ ctx, next }) => {
	if (!ctx.userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Unauthorized - Authentication required",
		});
	}
	return next({
		ctx: { ...ctx, userId: ctx.userId } satisfies AuthenticatedContext,
	});
});

export const publicProcedure: AfterableBuilder<Context, undefined> =
	wrapBuilder<Context, undefined>(baseProcedure);

export const protectedProcedure: AfterableBuilder<
	AuthenticatedContext,
	undefined
> = wrapBuilder<AuthenticatedContext, undefined>(
	baseProcedure.use(requireAuth),
);
