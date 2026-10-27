import { beforeEach, describe, expect, it, vi } from "vitest";

const env = {
	NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: "public-key" as string | undefined,
	WEB_PUSH_PRIVATE_KEY: "private-key" as string | undefined,
	WEB_PUSH_SUBJECT: "mailto:test@example.com",
};
const sendNotification = vi.fn();

vi.mock("@/lib/env", () => ({ envVars: env }));
vi.mock("web-push", () => ({ sendNotification }));

const { createPushService } = await import("./push-service");
const send = sendNotification;

const subscriptionFor = (id: string, athleteId: string) => ({
	id,
	athleteId,
	endpoint: `https://fcm.googleapis.com/fcm/send/${id}`,
	p256dh: `p256dh-${id}`,
	auth: `auth-${id}`,
});

type Subscription = ReturnType<typeof subscriptionFor>;
type PreferenceRow = { athleteId: string; scope: string; enabled: boolean };

function createFakeDb({
	subscriptions = [],
	preferences = [],
}: {
	subscriptions?: Subscription[];
	preferences?: PreferenceRow[];
}) {
	const db = {
		notification_preference: {
			findMany: vi.fn(async () => preferences),
		},
		push_subscription: {
			findMany: vi.fn(
				async ({ where }: { where: { athleteId: { in: string[] } } }) =>
					subscriptions.filter((s) => where.athleteId.in.includes(s.athleteId)),
			),
			updateMany: vi.fn(async () => ({ count: 0 })),
			deleteMany: vi.fn(async () => ({ count: 0 })),
		},
	};
	return db;
}

const asPushDb = (db: ReturnType<typeof createFakeDb>) =>
	db as unknown as Parameters<typeof createPushService>[0]["db"];

const message = {
	title: "Masters · Mike Tran",
	body: "Wind's up — moving tomorrow to the erg room, 6:00.",
	url: "/chat/chan_1",
	tag: "channel:chan_1",
};

beforeEach(() => {
	send.mockReset();
	send.mockResolvedValue({ statusCode: 201, body: "", headers: {} });
	env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY = "public-key";
	env.WEB_PUSH_PRIVATE_KEY = "private-key";
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("createPushService", () => {
	it("reports whether VAPID keys are configured", () => {
		const db = asPushDb(createFakeDb({}));
		expect(createPushService({ db }).isConfigured).toBe(true);
		expect(createPushService({ db }).publicKey).toBe("public-key");

		env.WEB_PUSH_PRIVATE_KEY = undefined;
		expect(createPushService({ db }).isConfigured).toBe(false);
	});
});

describe("sendPush", () => {
	it("sends the payload to every subscription with the VAPID details", async () => {
		const db = createFakeDb({
			subscriptions: [
				subscriptionFor("sub_1", "ath_a"),
				subscriptionFor("sub_2", "ath_a"),
				subscriptionFor("sub_3", "ath_b"),
			],
		});

		const result = await createPushService({ db: asPushDb(db) }).sendPush(
			["ath_a", "ath_b", "ath_a"],
			message,
		);

		expect(result).toEqual({
			reached: 2,
			sent: 3,
			failed: 0,
			removed: 0,
			skipped: 0,
		});
		expect(send).toHaveBeenCalledTimes(3);
		const [subscription, payload, options] = send.mock.calls[0];
		expect(subscription).toEqual({
			endpoint: "https://fcm.googleapis.com/fcm/send/sub_1",
			keys: { p256dh: "p256dh-sub_1", auth: "auth-sub_1" },
		});
		expect(JSON.parse(payload as string)).toMatchObject({
			title: message.title,
			body: message.body,
			url: message.url,
			tag: message.tag,
			icon: "/logo.png",
		});
		expect(options?.vapidDetails).toEqual({
			subject: "mailto:test@example.com",
			publicKey: "public-key",
			privateKey: "private-key",
		});
		expect(db.push_subscription.updateMany).toHaveBeenCalledWith({
			where: { id: { in: ["sub_1", "sub_2", "sub_3"] } },
			data: { lastUsedAt: expect.any(Date), failedAt: null },
		});
	});

	it("deletes subscriptions the push service reports as gone and flags other failures", async () => {
		const db = createFakeDb({
			subscriptions: [
				subscriptionFor("sub_ok", "ath_a"),
				subscriptionFor("sub_gone", "ath_a"),
				subscriptionFor("sub_missing", "ath_a"),
				subscriptionFor("sub_flaky", "ath_a"),
			],
		});
		send.mockImplementation(async ({ endpoint }) => {
			if (endpoint.endsWith("sub_gone")) throw { statusCode: 410 };
			if (endpoint.endsWith("sub_missing")) throw { statusCode: 404 };
			if (endpoint.endsWith("sub_flaky")) throw new Error("socket hang up");
			return { statusCode: 201, body: "", headers: {} };
		});

		const result = await createPushService({ db: asPushDb(db) }).sendPush(
			["ath_a"],
			message,
		);

		expect(result).toEqual({
			reached: 1,
			sent: 1,
			failed: 1,
			removed: 2,
			skipped: 0,
		});
		expect(db.push_subscription.deleteMany).toHaveBeenCalledWith({
			where: { id: { in: ["sub_gone", "sub_missing"] } },
		});
		expect(db.push_subscription.updateMany).toHaveBeenCalledWith({
			where: { id: { in: ["sub_flaky"] } },
			data: { failedAt: expect.any(Date) },
		});
	});

	it("skips athletes who turned everything off or turned off the message's scope", async () => {
		const db = createFakeDb({
			subscriptions: [
				subscriptionFor("sub_plain", "ath_plain"),
				subscriptionFor("sub_muted", "ath_muted"),
				subscriptionFor("sub_channel_off", "ath_channel_off"),
			],
			preferences: [
				{ athleteId: "ath_muted", scope: "all", enabled: false },
				{
					athleteId: "ath_channel_off",
					scope: "channel:chan_1",
					enabled: false,
				},
			],
		});

		const result = await createPushService({ db: asPushDb(db) }).sendPush(
			["ath_plain", "ath_muted", "ath_channel_off"],
			{ ...message, scope: "channel:chan_1" },
		);

		expect(result).toEqual({
			reached: 1,
			sent: 1,
			failed: 0,
			removed: 0,
			skipped: 2,
		});
		expect(db.notification_preference.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					athleteId: { in: ["ath_plain", "ath_muted", "ath_channel_off"] },
					scope: { in: ["all", "channel:chan_1"] },
				},
			}),
		);
		expect(db.push_subscription.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { athleteId: { in: ["ath_plain"] } } }),
		);
	});

	it("does nothing when push is not configured", async () => {
		env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY = undefined;
		const db = createFakeDb({
			subscriptions: [subscriptionFor("sub_1", "ath_a")],
		});

		const result = await createPushService({ db: asPushDb(db) }).sendPush(
			["ath_a"],
			message,
		);

		expect(result).toEqual({
			reached: 0,
			sent: 0,
			failed: 0,
			removed: 0,
			skipped: 1,
		});
		expect(send).not.toHaveBeenCalled();
		expect(db.push_subscription.findMany).not.toHaveBeenCalled();
	});

	it("does nothing for an empty audience", async () => {
		const db = createFakeDb({});

		const result = await createPushService({ db: asPushDb(db) }).sendPush(
			[],
			message,
		);

		expect(result).toEqual({
			reached: 0,
			sent: 0,
			failed: 0,
			removed: 0,
			skipped: 0,
		});
		expect(db.notification_preference.findMany).not.toHaveBeenCalled();
	});

	it("never throws into callers when the database fails", async () => {
		const db = createFakeDb({});
		db.notification_preference.findMany.mockRejectedValue(
			new Error("connection reset"),
		);

		await expect(
			createPushService({ db: asPushDb(db) }).sendPush(["ath_a"], message),
		).resolves.toEqual({
			reached: 0,
			sent: 0,
			failed: 0,
			removed: 0,
			skipped: 0,
		});
		expect(console.error).toHaveBeenCalled();
	});
});
