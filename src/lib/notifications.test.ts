import { describe, expect, it } from "vitest";
import {
	buildPushPayload,
	channelNotificationScope,
	filterNotificationRecipients,
	isNotificationEnabled,
	isPushServiceEndpoint,
} from "./notifications";

describe("isNotificationEnabled", () => {
	it("defaults to enabled when nothing is stored", () => {
		expect(isNotificationEnabled({})).toBe(true);
		expect(isNotificationEnabled({}, "schedule")).toBe(true);
	});

	it("turns everything off when the 'all' scope is off", () => {
		const preferences = { all: false, schedule: true };
		expect(isNotificationEnabled(preferences)).toBe(false);
		expect(isNotificationEnabled(preferences, "schedule")).toBe(false);
		expect(isNotificationEnabled(preferences, "channel:chan_1")).toBe(false);
	});

	it("turns off only the matching scope when a specific scope is off", () => {
		const preferences = { all: true, "channel:chan_1": false };
		expect(isNotificationEnabled(preferences, "channel:chan_1")).toBe(false);
		expect(isNotificationEnabled(preferences, "channel:chan_2")).toBe(true);
		expect(isNotificationEnabled(preferences, "schedule")).toBe(true);
		expect(isNotificationEnabled(preferences)).toBe(true);
	});
});

describe("filterNotificationRecipients", () => {
	const rows = [
		{ athleteId: "ath_muted", scope: "all", enabled: false },
		{ athleteId: "ath_no_schedule", scope: "schedule", enabled: false },
		{ athleteId: "ath_back_on", scope: "all", enabled: true },
	];

	it("keeps athletes without preferences and drops those with 'all' off", () => {
		expect(
			filterNotificationRecipients(
				["ath_plain", "ath_muted", "ath_no_schedule", "ath_back_on"],
				rows,
			),
		).toEqual(["ath_plain", "ath_no_schedule", "ath_back_on"]);
	});

	it("drops athletes who turned the message's scope off", () => {
		expect(
			filterNotificationRecipients(
				["ath_plain", "ath_muted", "ath_no_schedule"],
				rows,
				"schedule",
			),
		).toEqual(["ath_plain"]);
	});

	it("does not let one athlete's preferences affect another", () => {
		expect(
			filterNotificationRecipients(
				["ath_plain"],
				[{ athleteId: "ath_other", scope: "all", enabled: false }],
			),
		).toEqual(["ath_plain"]);
	});

	it("removes duplicate athlete ids", () => {
		expect(filterNotificationRecipients(["ath_a", "ath_a"], [])).toEqual([
			"ath_a",
		]);
	});
});

describe("buildPushPayload", () => {
	it("builds the payload the service worker reads, with the club icon", () => {
		expect(
			JSON.parse(
				buildPushPayload({
					title: "Masters · Mike Tran",
					body: "Wind's up — moving tomorrow to the erg room, 6:00.",
					url: "/chat/chan_1",
					tag: "channel:chan_1",
					scope: "channel:chan_1",
				}),
			),
		).toEqual({
			title: "Masters · Mike Tran",
			body: "Wind's up — moving tomorrow to the erg room, 6:00.",
			url: "/chat/chan_1",
			tag: "channel:chan_1",
			icon: "/logo.png",
		});
	});

	it("omits the tag when none is given", () => {
		const payload = JSON.parse(
			buildPushPayload({ title: "Schedule", body: "Entries close", url: "/" }),
		);
		expect(payload).not.toHaveProperty("tag");
		expect(payload).not.toHaveProperty("scope");
	});

	it("truncates long titles and bodies with an ellipsis", () => {
		const payload = JSON.parse(
			buildPushPayload({
				title: "t".repeat(500),
				body: "b".repeat(5000),
				url: "/",
			}),
		);
		expect(payload.title).toHaveLength(120);
		expect(payload.title.endsWith("…")).toBe(true);
		expect(payload.body).toHaveLength(400);
		expect(payload.body.endsWith("…")).toBe(true);
	});

	it("only links to paths inside the app", () => {
		const urlFor = (url: string) =>
			JSON.parse(buildPushPayload({ title: "t", body: "b", url })).url;
		expect(urlFor("/schedule?week=2026-10-19")).toBe(
			"/schedule?week=2026-10-19",
		);
		expect(urlFor("https://evil.example/phish")).toBe("/");
		expect(urlFor("//evil.example/phish")).toBe("/");
		expect(urlFor("")).toBe("/");
	});
});

describe("isPushServiceEndpoint", () => {
	it("accepts the major browser push services over https", () => {
		expect(
			isPushServiceEndpoint("https://fcm.googleapis.com/fcm/send/abc:def"),
		).toBe(true);
		expect(
			isPushServiceEndpoint(
				"https://updates.push.services.mozilla.com/wpush/v2/abc",
			),
		).toBe(true);
		expect(isPushServiceEndpoint("https://web.push.apple.com/QGx1")).toBe(true);
		expect(
			isPushServiceEndpoint(
				"https://wns2-par02p.notify.windows.com/w/?token=abc",
			),
		).toBe(true);
	});

	it("rejects other hosts, look-alikes, plain http and garbage", () => {
		expect(isPushServiceEndpoint("https://internal.example/hook")).toBe(false);
		expect(isPushServiceEndpoint("https://fcm.googleapis.com.evil.io/x")).toBe(
			false,
		);
		expect(isPushServiceEndpoint("https://evilfcm.googleapis.com/x")).toBe(
			false,
		);
		expect(isPushServiceEndpoint("http://fcm.googleapis.com/fcm/send/x")).toBe(
			false,
		);
		expect(isPushServiceEndpoint("not a url")).toBe(false);
	});
});

describe("channelNotificationScope", () => {
	it("namespaces channel ids", () => {
		expect(channelNotificationScope("chan_123")).toBe("channel:chan_123");
	});
});
