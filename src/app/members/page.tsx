import { z } from "zod";
import { AthleteListScene } from "@/scenes/athletes";
import { createAdminCaller } from "@/server/caller";

const querySchema = z.object({
	athleteId: z.string().optional(),
	action: z.enum(["create", "bulkCreate", "edit"]).optional(),
});

export default async function MembersPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { athleteId, action } = querySchema.parse(await searchParams);
	const caller = await createAdminCaller();
	const [membersResponse, { data: activities }, selectedAthlete, athleteStats] =
		await Promise.all([
			caller.members.getMembers(),
			athleteId
				? caller.activities.getActivities({ athleteId })
				: Promise.resolve({ data: [] }),
			caller.athletes.getAthleteById({ id: athleteId }),
			athleteId ? caller.athletes.getAthleteStats({ athleteId }) : null,
		]);

	return (
		<AthleteListScene
			initialData={membersResponse}
			selectedAthlete={selectedAthlete}
			activities={activities}
			athleteStats={athleteStats}
			isCreateDrawerOpen={action === "create"}
			isBulkCreateDrawerOpen={action === "bulkCreate"}
			isEditingAthlete={action === "edit"}
		/>
	);
}
