import { TRPCError } from "@trpc/server";
import { routes } from "@/lib/routes";
import type { AuthenticatedContext } from "@/server/context";

export async function sendTestCommand(
	_input: undefined,
	{ athlete, services }: AuthenticatedContext,
) {
	if (!services.push.isConfigured) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Push notifications are not configured on the server.",
		});
	}

	return services.push.sendPush([athlete.id], {
		title: "Notifications are on",
		body: "You'll hear about practice changes, regatta updates and messages from your groups.",
		url: routes.settings.notifications(),
		tag: "test",
	});
}
