import { describe, expect, it } from "vitest";
import { concept2UserSchema } from "./concept2User.schema";

const user = {
	id: 1234,
	username: "rower",
	first_name: "Pat",
	last_name: "Rower",
	gender: "F",
	dob: "1990-01-01",
	email: "pat@example.com",
	country: "CAN",
	profile_image: null,
	age_restricted: false,
	email_permission: false,
	max_heart_rate: null,
	logbook_privacy: "private",
};

describe("concept2UserSchema", () => {
	it("accepts a user without a max heart rate", () => {
		expect(concept2UserSchema.safeParse(user).success).toBe(true);
	});

	it("accepts a user who has set a max heart rate", () => {
		const parsed = concept2UserSchema.safeParse({
			...user,
			max_heart_rate: 192,
		});
		expect(parsed.success).toBe(true);
	});
});
