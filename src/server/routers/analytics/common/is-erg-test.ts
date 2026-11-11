import { concept2ActivitySchema } from "@/schemas/concept2Activity.schema";

export function isErgTest(
	activity: { type: string; distance: number; conceptTwoData: unknown },
	targetDistance: number,
) {
	if (activity.type !== "erg" || activity.distance !== targetDistance) {
		return false;
	}
	const { data } = concept2ActivitySchema
		.pick({ workout_type: true })
		.safeParse(activity.conceptTwoData);
	return !data?.workout_type.includes("Interval");
}
