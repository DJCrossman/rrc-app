import { describe, expect, it } from "vitest";
import { resolveEventAudiences } from "./event-audience";

const membersByGroup = new Map([
	["grp_masters", ["ath_a", "ath_b"]],
	["grp_competitive", ["ath_b", "ath_c"]],
]);
const everyone = ["ath_a", "ath_b", "ath_c", "ath_d"];

const audienceOf = (event: Parameters<typeof resolveEventAudiences>[0][0]) => [
	...(resolveEventAudiences([event], { everyone, membersByGroup }).get(
		event.id,
	) ?? []),
];

describe("resolveEventAudiences", () => {
	it("sends club events to everyone", () => {
		expect(audienceOf({ id: "evt_1", audience: "club", groups: [] })).toEqual(
			everyone,
		);
	});

	it("sends group events to the members of each group once", () => {
		expect(
			audienceOf({
				id: "evt_2",
				audience: "groups",
				groups: [{ groupId: "grp_masters" }, { groupId: "grp_competitive" }],
			}).sort(),
		).toEqual(["ath_a", "ath_b", "ath_c"]);
	});

	it("leaves out athletes outside the event's groups", () => {
		expect(
			audienceOf({
				id: "evt_3",
				audience: "groups",
				groups: [{ groupId: "grp_masters" }],
			}),
		).not.toContain("ath_d");
	});

	it("treats a group event with no groups as club-wide", () => {
		expect(audienceOf({ id: "evt_4", audience: "groups", groups: [] })).toEqual(
			everyone,
		);
	});

	it("reaches nobody when its groups have no members", () => {
		expect(
			audienceOf({
				id: "evt_5",
				audience: "groups",
				groups: [{ groupId: "grp_gone" }],
			}),
		).toEqual([]);
	});
});
