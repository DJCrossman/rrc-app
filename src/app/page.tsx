import { DashboardScene } from "@/scenes/dashboard/DashboardScene";
import { createServerCaller } from "@/server/caller";

export default async function HomePage() {
	const caller = await createServerCaller();
	const data = await caller.analytics.getAnalytics();
	return <DashboardScene data={data} />;
}
