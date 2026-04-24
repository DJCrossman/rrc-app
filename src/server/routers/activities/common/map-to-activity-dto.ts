import type { Prisma } from "@/generated/prisma/client";
import { concept2ActivitySchema } from "@/schemas/concept2Activity.schema";
import { stravaActivitySchema } from "@/schemas/stravaActivity.schema";
import {
	athleteInclude,
	mapToAthleteDto,
} from "../../athletes/common/map-to-athlete-dto";
import {
	mapToWorkoutDto,
	workoutInclude,
} from "../../workouts/common/map-to-workout-dto";

export const activityInclude = {
	athlete: { include: athleteInclude },
	boat: true,
	erg: true,
	workout: { include: workoutInclude },
} as const;

export type ActivityRow = Prisma.activityGetPayload<{
	include: typeof activityInclude;
}>;

function parseStravaData(raw: unknown) {
	if (!raw) return undefined;
	const normalized = JSON.parse(
		JSON.stringify(raw, (_key, value) => (value === null ? undefined : value)),
	);
	const result = stravaActivitySchema.safeParse(normalized);
	return result.success ? result.data : undefined;
}

export function mapToActivityDto(row: ActivityRow) {
	if (row.type === "water" && row.boat) {
		return {
			id: row.id,
			name: row.name,
			startDate: row.startDate.toISOString(),
			timezone: row.timezone,
			workoutType: row.workoutType,
			elapsedTime: row.elapsedTime,
			distance: row.distance,
			isStrava: row.stravaId !== null,
			stravaData: parseStravaData(row.stravaData),
			athlete: mapToAthleteDto(row.athlete),
			workout: row.workout ? mapToWorkoutDto(row.workout) : undefined,
			type: "water" as const,
			boat: {
				id: row.boat.id,
				name: row.boat.name,
				manufacturer: row.boat.manufacturer,
				seats: row.boat.seats,
				rigging: row.boat.rigging,
				weightMinKg: row.boat.weightMinKg,
				weightMaxKg: row.boat.weightMaxKg,
				preferredWeightUnit: row.boat.preferredWeightUnit,
			},
		};
	}

	if (row.type === "erg" && row.erg) {
		const conceptTwoData = row.conceptTwoData
			? concept2ActivitySchema.safeParse(
					JSON.parse(
						JSON.stringify(row.conceptTwoData, (_key, value) =>
							value === null ? undefined : value,
						),
					),
				).data
			: undefined;

		return {
			id: row.id,
			name: row.name,
			startDate: row.startDate.toISOString(),
			timezone: row.timezone,
			workoutType: row.workoutType,
			elapsedTime: row.elapsedTime,
			distance: row.distance,
			isStrava: row.stravaId !== null,
			stravaData: parseStravaData(row.stravaData),
			athlete: mapToAthleteDto(row.athlete),
			workout: row.workout ? mapToWorkoutDto(row.workout) : undefined,
			type: "erg" as const,
			erg: {
				id: row.erg.id,
				name: row.erg.name,
				manufacturer: row.erg.manufacturer,
				firmwareVersion: row.erg.firmwareVersion,
				hardwareVersion: row.erg.hardwareVersion,
				serialNumber: row.erg.serialNumber,
				dataCode: row.erg.dataCode,
			},
			conceptTwoData,
		};
	}

	throw new Error(`Activity ${row.id} has invalid state for type ${row.type}`);
}
