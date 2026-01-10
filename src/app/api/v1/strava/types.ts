import type { StravaActivity, StravaUser } from "@/schemas";

export type { StravaActivity, StravaUser };

// Backwards compatibility aliases
export type StravaAthlete = StravaUser;

export interface StravaTokenData {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	expires_at: number;
	token_type: string;
	athlete: StravaUser;
}

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
