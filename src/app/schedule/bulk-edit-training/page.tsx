import { z } from "zod";
import { parseWeekStart } from "@/lib/schedule/week";
import { TrainingBulkEditScene } from "@/scenes/schedule";
import { createServerCaller } from "@/server/caller";

const querySchema = z.object({
	week: z.string().optional(),
});

export default async function TrainingBulkEditPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { week } = querySchema.parse(await searchParams);
	const caller = await createServerCaller();
	const schedule = await caller.schedule.getWeek({
		weekStart: parseWeekStart(week).toISODate(),
		type: "training",
	});

	return <TrainingBulkEditScene week={schedule} />;
}
