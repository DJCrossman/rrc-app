import type { Concept2Activity, Concept2User } from "@/schemas";

export type { Concept2Activity, Concept2User };

// Backwards compatibility aliases
export type Concept2Result = Concept2Activity;

export class Concept2Error extends Error {
	auth_url?: string;
	status?: number;

	constructor(value: Partial<Concept2Error> = {}) {
		super(value.message);
		this.name = "Concept2Error";
		this.auth_url = value.auth_url;
		this.status = value.status;
	}
}
