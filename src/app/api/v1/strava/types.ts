import { z } from "zod";

export interface StravaTokenData {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	expires_at: number;
	token_type: string;
	athlete: StravaAthlete;
}

export const stravaAthleteSchema = z.object({
	id: z.number(),
	username: z.string().nullable().optional(),
	resource_state: z.number(),
	firstname: z.string(),
	lastname: z.string(),
	bio: z.string().nullable().optional(),
	city: z.string().nullable().optional(),
	state: z.string().nullable().optional(),
	country: z.string().nullable().optional(),
	sex: z.string().nullable().optional(),
	premium: z.boolean().optional(),
	summit: z.boolean().optional(),
	created_at: z.string(),
	updated_at: z.string(),
	badge_type_id: z.number().optional(),
	weight: z.number().nullable().optional(),
	profile_medium: z.string(),
	profile: z.string(),
	friend: z.null().optional(),
	follower: z.null().optional(),
});

export type StravaAthlete = z.infer<typeof stravaAthleteSchema>;

export const stravaActivitySchema = z.object({
	id: z.number(),
	resource_state: z.number(),
	external_id: z.string().nullable().optional(),
	upload_id: z.number().nullable().optional(),
	athlete: z.object({
		id: z.number(),
		resource_state: z.number(),
	}),
	name: z.string(),
	distance: z.number(),
	moving_time: z.number(),
	elapsed_time: z.number(),
	total_elevation_gain: z.number(),
	type: z.string(),
	sport_type: z.string(),
	workout_type: z.number().nullable().optional(),
	start_date: z.string(),
	start_date_local: z.string(),
	timezone: z.string(),
	utc_offset: z.number(),
	location_city: z.string().nullable().optional(),
	location_state: z.string().nullable().optional(),
	location_country: z.string().nullable().optional(),
	achievement_count: z.number(),
	kudos_count: z.number(),
	comment_count: z.number(),
	athlete_count: z.number(),
	photo_count: z.number(),
	map: z.object({
		id: z.string(),
		summary_polyline: z.string().nullable().optional(),
		resource_state: z.number(),
	}),
	trainer: z.boolean(),
	commute: z.boolean(),
	manual: z.boolean(),
	private: z.boolean(),
	visibility: z.string(),
	flagged: z.boolean(),
	gear_id: z.string().nullable().optional(),
	start_latlng: z.array(z.number()).nullable().optional(),
	end_latlng: z.array(z.number()).nullable().optional(),
	average_speed: z.number(),
	max_speed: z.number(),
	average_cadence: z.number().nullable().optional(),
	average_heartrate: z.number().nullable().optional(),
	max_heartrate: z.number().nullable().optional(),
	heartrate_opt_out: z.boolean().optional(),
	display_hide_heartrate_option: z.boolean().optional(),
	elev_high: z.number().nullable().optional(),
	elev_low: z.number().nullable().optional(),
	upload_id_str: z.string().nullable().optional(),
	from_accepted_tag: z.boolean().optional(),
	pr_count: z.number().optional(),
	total_photo_count: z.number().optional(),
	has_heartrate: z.boolean().optional(),
	average_watts: z.number().nullable().optional(),
	max_watts: z.number().nullable().optional(),
	weighted_average_watts: z.number().nullable().optional(),
	kilojoules: z.number().nullable().optional(),
	device_watts: z.boolean().optional(),
	has_kudoed: z.boolean().optional(),
	suffer_score: z.number().nullable().optional(),
});

export type StravaActivity = z.infer<typeof stravaActivitySchema>;

export class StravaError extends Error {
	auth_url?: string;
	status?: number;

	constructor(value: Partial<StravaError> = {}) {
		super(value.message);
		this.name = "StravaError";
		this.auth_url = value.auth_url;
		this.status = value.status;
	}
}
