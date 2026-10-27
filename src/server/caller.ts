import "server-only";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { createTRPCContext } from "./context";
import { appRouter } from "./root";

export async function createServerCaller() {
	const ctx = await createTRPCContext();
	return appRouter.createCaller(ctx);
}

export async function createAdminCaller() {
	const ctx = await createTRPCContext();
	if (!ctx.user?.isAdmin) {
		redirect(routes.dashboard.home());
	}
	return appRouter.createCaller(ctx);
}
