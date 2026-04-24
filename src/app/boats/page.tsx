import { z } from "zod";
import { BoatListScene } from "@/scenes/boats";
import { createServerCaller } from "@/server/caller";

const querySchema = z.object({
	boatId: z.string().optional(),
	action: z.literal("create").optional(),
});

export default async function BoatsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { boatId, action } = querySchema.parse(await searchParams);
	const caller = await createServerCaller();
	const [{ data }, { data: activities }, selectedBoat] = await Promise.all([
		caller.boats.getBoats(),
		boatId
			? caller.activities.getActivities({ boatId })
			: Promise.resolve({ data: [] }),
		boatId ? caller.boats.getBoatById({ id: boatId }) : null,
	]);

	return (
		<BoatListScene
			data={data}
			selectedBoat={selectedBoat}
			activities={activities}
			isCreateDrawerOpen={action === "create"}
		/>
	);
}
