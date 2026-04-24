import { z } from "zod";
import { ErgListScene } from "@/scenes/ergs";
import { createServerCaller } from "@/server/caller";

const querySchema = z.object({
	ergId: z.string().optional(),
	action: z.literal("create").optional(),
});

export default async function ErgsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { ergId, action } = querySchema.parse(await searchParams);
	const caller = await createServerCaller();
	const [{ data }, { data: activities }, selectedErg] = await Promise.all([
		caller.ergs.getErgs(),
		ergId
			? caller.activities.getActivities({ ergId })
			: Promise.resolve({ data: [] }),
		ergId ? caller.ergs.getErgById({ id: ergId }) : null,
	]);

	return (
		<ErgListScene
			data={data}
			selectedErg={selectedErg}
			activities={activities}
			isCreateDrawerOpen={action === "create"}
		/>
	);
}
