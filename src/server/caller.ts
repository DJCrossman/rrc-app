import "server-only";
import { createTRPCContext } from "./context";
import { appRouter } from "./root";

export async function createServerCaller() {
	const ctx = await createTRPCContext();
	return appRouter.createCaller(ctx);
}
