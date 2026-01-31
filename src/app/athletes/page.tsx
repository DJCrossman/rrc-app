import { RedirectType, redirect } from "next/navigation";
import { z } from "zod";
import {
	createAthlete,
	getAthleteById,
	getAthleteStats,
	updateAthlete,
} from "@/app/api/v1/athletes/actions";
import { routes } from "@/lib/routes";
import { AthleteListScene } from "@/scenes/athletes";
import type { Athlete, CreateAthlete } from "@/schemas/athlete.schema";
import { getActivities } from "../api/v1/activities/actions";
import { getAthletes } from "../api/v1/athletes/actions";

const querySchema = z.object({
	athleteId: z.coerce.number().optional(),
	action: z.literal("create").optional(),
});

export default async function AthletesPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { athleteId, action } = querySchema.parse(await searchParams);
	const { data } = await getAthletes();
	const { data: activities } = athleteId
		? await getActivities({ athleteId })
		: { data: [] };
	const selectedAthlete = await getAthleteById(athleteId);
	const athleteStats = athleteId ? await getAthleteStats(athleteId) : null;

	return (
		<AthleteListScene
			data={data}
			selectedAthlete={selectedAthlete}
			activities={activities}
			athleteStats={athleteStats}
			isCreateDrawerOpen={action === "create"}
			onCreateAthlete={async (athlete: CreateAthlete) => {
				"use server";
				await createAthlete(athlete);
				redirect(routes.athletes.list(), RedirectType.push);
			}}
			onUpdateAthlete={async (athlete: Athlete) => {
				"use server";
				await updateAthlete(athlete);
			}}
		/>
	);
}
