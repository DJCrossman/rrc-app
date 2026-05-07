import type { AuthenticatedContext } from "@/server/context";

export async function disconnectRcaCommand(
	_input: undefined,
	{ services }: AuthenticatedContext,
) {
	await services.rca.disconnect();
	return { ok: true as const };
}
