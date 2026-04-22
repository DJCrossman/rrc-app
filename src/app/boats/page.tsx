import { RedirectType, redirect } from "next/navigation";
import { z } from "zod";
import { getActivities } from "@/app/api/v1/activities/actions";
import type { Boat } from "@/app/api/v1/boats/actions";
import {
	createBoat,
	getBoatById,
	getBoats,
	updateBoat,
} from "@/app/api/v1/boats/actions";
import { routes } from "@/lib/routes";
import { BoatListScene } from "@/scenes/boats";
import type { CreateBoat } from "@/schemas";

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

	const { data } = await getBoats();
	const { data: activities } = boatId
		? await getActivities({ boatId })
		: { data: [] };
	const selectedBoat = boatId ? await getBoatById(boatId) : null;

	return (
		<BoatListScene
			data={data}
			selectedBoat={selectedBoat}
			activities={activities}
			isCreateDrawerOpen={action === "create"}
			onCreateBoat={async (boat: CreateBoat) => {
				"use server";
				await createBoat(boat);
				redirect(routes.boats.list(), RedirectType.push);
			}}
			onUpdateBoat={async (boat: Boat) => {
				"use server";
				await updateBoat(boat);
			}}
		/>
	);
}
