import { ScheduleScene } from "@/scenes/schedule";
import { createServerCaller } from "@/server/caller";
import { loadSchedulePage, scheduleQuerySchema } from "./load-schedule-page";

export default async function SchedulePage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const query = scheduleQuerySchema.parse(await searchParams);
	const caller = await createServerCaller();
	const [props, { data: groups }] = await Promise.all([
		loadSchedulePage(caller, query),
		caller.groups.getGroups(),
	]);

	return <ScheduleScene {...props} groups={groups} />;
}
