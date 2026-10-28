import type { TRPC_ERROR_CODE_KEY } from "@trpc/server";

type PermissionError = { code: TRPC_ERROR_CODE_KEY; message: string };

/**
 * A reusable access rule for a procedure, checked after its input is parsed
 * and before its handler runs: `viewerProcedure.input(s).permission(rule)`.
 * The rule carries the error its callers throw when it fails, so a rule that
 * hides what exists (a group you're not in) can answer NOT_FOUND.
 */
export type Permission<TContext, TInput> = {
	check: (args: { ctx: TContext; input: TInput }) => boolean | Promise<boolean>;
	error: PermissionError;
};

const FORBIDDEN: PermissionError = {
	code: "FORBIDDEN",
	message: "You don't have access to this",
};

export function definePermission<TContext, TInput>(
	check: Permission<TContext, TInput>["check"],
	error: PermissionError = FORBIDDEN,
): Permission<TContext, TInput> {
	return { check, error };
}
