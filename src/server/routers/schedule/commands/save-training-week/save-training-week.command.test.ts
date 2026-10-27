import { describe, expect, it, vi } from "vitest";
import type { CreateEvent } from "@/schemas";
import type { AdminContext } from "@/server/context";
import { saveTrainingWeekCommand } from "./save-training-week.command";

// Monday Jan 7 2030, 6am in Regina — safely in the future whenever this runs.
const UPCOMING = new Date("2030-01-07T12:00:00.000Z");
const UPCOMING_ISO = "2030-01-07T06:00:00.000-06:00";

describe("saveTrainingWeekCommand", () => {
	it("deletes, updates and creates inside one transaction", async () => {
		const { context, calls } = createContext([
			{ id: "evt_gone", type: "training", workoutId: "work_gone" },
			{ id: "evt_1", type: "training", workoutId: "work_1" },
		]);

		await saveTrainingWeekCommand(
			{
				creates: [training()],
				updates: [{ ...training(), id: "evt_1" }],
				deleteIds: ["evt_gone"],
				notify: true,
			},
			context,
		);

		expect(calls.transactions).toBe(1);
		expect(calls.order).toEqual([
			"event.deleteMany",
			"workout.deleteMany",
			"workout.update",
			"event.update",
			"workout.create",
			"event.create",
		]);
	});

	it("deletes a removed session's workout along with the event", async () => {
		const { context, calls } = createContext([
			{ id: "evt_gone", type: "training", workoutId: "work_gone" },
		]);

		await saveTrainingWeekCommand(
			{ creates: [], updates: [], deleteIds: ["evt_gone"], notify: true },
			context,
		);

		expect(calls.args["event.deleteMany"]).toEqual({
			where: { id: { in: ["evt_gone"] } },
		});
		expect(calls.args["workout.deleteMany"]).toEqual({
			where: { id: { in: ["work_gone"] } },
		});
	});

	it("writes composition as one row per zone, skipping empty zones", async () => {
		const { context, calls } = createContext([]);

		await saveTrainingWeekCommand(
			{
				creates: [training({ zoneMinutes: { C6: 60, C5: 20, C4: 0 } })],
				updates: [],
				deleteIds: [],
				notify: true,
			},
			context,
		);

		expect(calls.args["workout.create"].data.zoneMinutes).toEqual({
			create: [
				{ intensityCategory: "C6", minutes: 60 },
				{ intensityCategory: "C5", minutes: 20 },
			],
		});
	});

	it("replaces composition wholesale on update", async () => {
		const { context, calls } = createContext([
			{ id: "evt_1", type: "training", workoutId: "work_1" },
		]);

		await saveTrainingWeekCommand(
			{
				creates: [],
				updates: [{ ...training({ zoneMinutes: { C6: 45 } }), id: "evt_1" }],
				deleteIds: [],
				notify: true,
			},
			context,
		);

		expect(calls.args["workout.update"].data.zoneMinutes).toEqual({
			deleteMany: {},
			create: [{ intensityCategory: "C6", minutes: 45 }],
		});
	});

	it("leaves composition alone when an update doesn't carry it", async () => {
		// The schedule's own event form has no composition fields.
		const { context, calls } = createContext([
			{ id: "evt_1", type: "training", workoutId: "work_1" },
		]);

		await saveTrainingWeekCommand(
			{
				creates: [],
				updates: [{ ...training({ zoneMinutes: undefined }), id: "evt_1" }],
				deleteIds: [],
				notify: true,
			},
			context,
		);

		expect(calls.args["workout.update"].data).not.toHaveProperty("zoneMinutes");
	});

	it("refuses to touch sessions that aren't training", async () => {
		const { context, calls } = createContext([
			{ id: "evt_regatta", type: "regatta", workoutId: null },
		]);

		await expect(
			saveTrainingWeekCommand(
				{ creates: [], updates: [], deleteIds: ["evt_regatta"], notify: true },
				context,
			),
		).rejects.toThrow("Only training sessions can be bulk edited");
		expect(calls.transactions).toBe(0);
	});

	it("refuses unknown events before writing anything", async () => {
		const { context, calls } = createContext([]);

		await expect(
			saveTrainingWeekCommand(
				{
					creates: [],
					updates: [{ ...training(), id: "evt_missing" }],
					deleteIds: [],
					notify: true,
				},
				context,
			),
		).rejects.toThrow("Event not found");
		expect(calls.transactions).toBe(0);
	});

	it("plans one summary for athletes going to a session that moved", async () => {
		const { context } = createContext([
			{
				id: "evt_1",
				type: "training",
				workoutId: "work_1",
				rsvps: [{ athleteId: "ath_a" }, { athleteId: "ath_b" }],
			},
		]);

		const result = await saveTrainingWeekCommand(
			{
				creates: [],
				updates: [
					{
						...training(),
						startAt: "2030-01-07T17:00:00.000-06:00",
						id: "evt_1",
					},
				],
				deleteIds: [],
				notify: true,
			},
			context,
		);

		expect(result.notifications).toHaveLength(1);
		expect(result.notifications[0].athleteIds).toEqual(["ath_a", "ath_b"]);
		expect(result.notifications[0].message.title).toBe(
			"A practice for the week of Jan 6 has changed",
		);
	});

	it("plans a cancellation for a removed session", async () => {
		const { context } = createContext([
			{
				id: "evt_1",
				type: "training",
				workoutId: "work_1",
				rsvps: [{ athleteId: "ath_a" }],
			},
		]);

		const result = await saveTrainingWeekCommand(
			{ creates: [], updates: [], deleteIds: ["evt_1"], notify: true },
			context,
		);

		expect(result.notifications[0].message.title).toBe(
			"A practice for the week of Jan 6 has been cancelled",
		);
	});

	it("plans nothing when the coach unticks notify", async () => {
		const { context } = createContext([
			{
				id: "evt_1",
				type: "training",
				workoutId: "work_1",
				rsvps: [{ athleteId: "ath_a" }],
			},
		]);

		const result = await saveTrainingWeekCommand(
			{ creates: [], updates: [], deleteIds: ["evt_1"], notify: false },
			context,
		);

		expect(result.notifications).toEqual([]);
	});

	it("stays silent for edits that only touch the workout", async () => {
		const { context } = createContext([
			{
				id: "evt_1",
				type: "training",
				workoutId: "work_1",
				rsvps: [{ athleteId: "ath_a" }],
			},
		]);

		const result = await saveTrainingWeekCommand(
			{
				creates: [],
				updates: [
					{
						...training({ description: "4x2k" }),
						startAt: UPCOMING_ISO,
						id: "evt_1",
					},
				],
				deleteIds: [],
				notify: true,
			},
			context,
		);

		expect(result.notifications).toEqual([]);
	});

	it("stays silent about sessions that already happened", async () => {
		const { context } = createContext([
			{
				id: "evt_1",
				type: "training",
				workoutId: "work_1",
				startAt: new Date("2020-01-06T12:00:00.000Z"),
				rsvps: [{ athleteId: "ath_a" }],
			},
		]);

		const result = await saveTrainingWeekCommand(
			{ creates: [], updates: [], deleteIds: ["evt_1"], notify: true },
			context,
		);

		expect(result.notifications).toEqual([]);
	});

	it("propagates a failed write so the transaction rolls back", async () => {
		const { context, tx } = createContext([]);
		tx.event.create.mockRejectedValueOnce(new Error("boom"));

		await expect(
			saveTrainingWeekCommand(
				{ creates: [training()], updates: [], deleteIds: [], notify: true },
				context,
			),
		).rejects.toThrow("boom");
	});
});

function training(
	workout: Partial<NonNullable<CreateEvent["workout"]>> = {},
): CreateEvent {
	return {
		type: "training",
		title: "Long row",
		description: null,
		startAt: "2026-10-19T06:30:00.000-06:00",
		endAt: "2026-10-19T08:00:00.000-06:00",
		allDay: false,
		timezone: "America/Regina",
		location: null,
		audience: "club",
		groupIds: [],
		volunteerSpots: null,
		workout: {
			description: "C6 in zone",
			workoutType: "time",
			activityType: "water",
			elapsedTime: 5_400_000,
			distance: 18_000,
			intervalCount: 1,
			intensityCategory: "C6",
			fragments: [],
			...workout,
		},
	};
}

type ExistingEvent = {
	id: string;
	type: string;
	workoutId: string | null;
	startAt?: Date;
	location?: string | null;
	rsvps?: { athleteId: string }[];
};

function createContext(existingEvents: ExistingEvent[]) {
	const existing = existingEvents.map((event) => ({
		startAt: UPCOMING,
		location: null,
		timezone: "America/Regina",
		rsvps: [],
		...event,
	}));
	const calls = {
		order: [] as string[],
		// biome-ignore lint/suspicious/noExplicitAny: recorded Prisma args vary per call
		args: {} as Record<string, any>,
		transactions: 0,
	};
	const record = (name: string, result: unknown) => async (args: unknown) => {
		calls.order.push(name);
		calls.args[name] = args;
		return result;
	};

	const tx = {
		event: {
			create: vi.fn(record("event.create", { id: "evt_new" })),
			update: vi.fn(record("event.update", { id: "evt_1" })),
			deleteMany: vi.fn(record("event.deleteMany", { count: 1 })),
		},
		workout: {
			create: vi.fn(record("workout.create", { id: "work_new" })),
			update: vi.fn(record("workout.update", { id: "work_1" })),
			deleteMany: vi.fn(record("workout.deleteMany", { count: 1 })),
		},
	};

	const context = {
		athlete: { id: "ath_coach" },
		db: {
			event: {
				findMany: vi.fn(
					async ({ where }: { where: { id: { in: string[] } } }) =>
						existing.filter((event) => where.id.in.includes(event.id)),
				),
			},
			$transaction: async (fn: (client: typeof tx) => Promise<unknown>) => {
				calls.transactions += 1;
				return fn(tx);
			},
		},
	} as unknown as AdminContext;

	return { context, calls, tx };
}
