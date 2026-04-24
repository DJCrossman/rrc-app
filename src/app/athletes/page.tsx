import { z } from "zod";
import { AthleteListScene } from "@/scenes/athletes";
import { createServerCaller } from "@/server/caller";

const querySchema = z.object({
	athleteId: z.string().optional(),
	action: z.literal("create").optional(),
});

export default async function AthletesPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { athleteId, action } = querySchema.parse(await searchParams);
	const caller = await createServerCaller();
	const [{ data }, { data: activities }, selectedAthlete, athleteStats] =
		await Promise.all([
			caller.athletes.getAthletes(),
			athleteId
				? caller.activities.getActivities({ athleteId })
				: Promise.resolve({ data: [] }),
			caller.athletes.getAthleteById({ id: athleteId }),
			athleteId ? caller.athletes.getAthleteStats({ athleteId }) : null,
		]);

	return (
		<AthleteListScene
			data={data}
			selectedAthlete={selectedAthlete}
			activities={activities}
			athleteStats={athleteStats}
			isCreateDrawerOpen={action === "create"}
		/>
	);
}
