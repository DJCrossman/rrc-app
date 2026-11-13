import { PrismaNeon } from "@prisma/adapter-neon";
import {
	type EventType,
	type Gender,
	type IntensityCategory,
	type Prisma,
	PrismaClient,
	type RsvpStatus,
	type WorkoutType,
} from "../../src/generated/prisma/client";
import { EVERYONE_CHANNEL_ID } from "../../src/schemas/chat.schema";

const DAY = 24 * 60 * 60 * 1000;

export const DUMMY_ORGANIZATION_ID = "org_dummy_rrc";
export const E2E_ADMIN_USER_ID = "user_e2e_admin";
export const E2E_MEMBER_USER_ID = "user_e2e_member";

const PROGRAMS = [
	{
		rcaProgramId: "dummy-masters",
		name: "Masters Rowing",
		description: "Early-morning crews for rowers who remember wooden oars.",
	},
	{
		rcaProgramId: "dummy-competitive",
		name: "Competitive Squad",
		description: "Racing crews training for the summer regatta season.",
	},
	{
		rcaProgramId: "dummy-learn-to-row",
		name: "Learn to Row",
		description: "Eight weeks from never-held-an-oar to a full crew.",
	},
];

// The first athlete is the e2e admin and the second the e2e member. Every
// athlete is also a Clerk emulator user. `splitSeconds` is their 2K pace per 500 m.
export const ATHLETES: {
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
	gender: Gender;
	dateOfBirth: string;
	heightInCm: number;
	weightInKg: number;
	program: string;
	splitSeconds: number;
}[] = [
	{
		userId: E2E_ADMIN_USER_ID,
		email: "avery.coxwell@example.com",
		firstName: "Avery",
		lastName: "Coxwell",
		gender: "female",
		dateOfBirth: "1984-03-12",
		heightInCm: 168,
		weightInKg: 62,
		program: "dummy-masters",
		splitSeconds: 112,
	},
	{
		userId: E2E_MEMBER_USER_ID,
		email: "morgan.oarsby@example.com",
		firstName: "Morgan",
		lastName: "Oarsby",
		gender: "male",
		dateOfBirth: "1998-07-04",
		heightInCm: 188,
		weightInKg: 84,
		program: "dummy-competitive",
		splitSeconds: 98,
	},
	{
		userId: "user_dummy_03",
		email: "jordan.sculler@example.com",
		firstName: "Jordan",
		lastName: "Sculler",
		gender: "nonbinary",
		dateOfBirth: "1995-11-23",
		heightInCm: 176,
		weightInKg: 71,
		program: "dummy-competitive",
		splitSeconds: 104,
	},
	{
		userId: "user_dummy_04",
		email: "riley.feathers@example.com",
		firstName: "Riley",
		lastName: "Feathers",
		gender: "female",
		dateOfBirth: "2001-01-30",
		heightInCm: 174,
		weightInKg: 67,
		program: "dummy-competitive",
		splitSeconds: 106,
	},
	{
		userId: "user_dummy_05",
		email: "casey.catchpole@example.com",
		firstName: "Casey",
		lastName: "Catchpole",
		gender: "male",
		dateOfBirth: "1979-05-17",
		heightInCm: 182,
		weightInKg: 88,
		program: "dummy-masters",
		splitSeconds: 108,
	},
	{
		userId: "user_dummy_06",
		email: "quinn.portside@example.com",
		firstName: "Quinn",
		lastName: "Portside",
		gender: "female",
		dateOfBirth: "1999-09-09",
		heightInCm: 180,
		weightInKg: 73,
		program: "dummy-competitive",
		splitSeconds: 102,
	},
	{
		userId: "user_dummy_07",
		email: "taylor.bowman@example.com",
		firstName: "Taylor",
		lastName: "Bowman",
		gender: "male",
		dateOfBirth: "1972-02-14",
		heightInCm: 179,
		weightInKg: 81,
		program: "dummy-masters",
		splitSeconds: 115,
	},
	{
		userId: "user_dummy_08",
		email: "rowan.rigger@example.com",
		firstName: "Rowan",
		lastName: "Rigger",
		gender: "nonbinary",
		dateOfBirth: "2003-06-21",
		heightInCm: 171,
		weightInKg: 65,
		program: "dummy-learn-to-row",
		splitSeconds: 124,
	},
	{
		userId: "user_dummy_09",
		email: "jamie.blade@example.com",
		firstName: "Jamie",
		lastName: "Blade",
		gender: "female",
		dateOfBirth: "1990-12-01",
		heightInCm: 165,
		weightInKg: 59,
		program: "dummy-learn-to-row",
		splitSeconds: 128,
	},
	{
		userId: "user_dummy_10",
		email: "sam.keelson@example.com",
		firstName: "Sam",
		lastName: "Keelson",
		gender: "male",
		dateOfBirth: "1987-08-08",
		heightInCm: 185,
		weightInKg: 90,
		program: "dummy-masters",
		splitSeconds: 110,
	},
	{
		userId: "user_dummy_11",
		email: "drew.gunwale@example.com",
		firstName: "Drew",
		lastName: "Gunwale",
		gender: "female",
		dateOfBirth: "2000-04-18",
		heightInCm: 177,
		weightInKg: 70,
		program: "dummy-competitive",
		splitSeconds: 105,
	},
	{
		userId: "user_dummy_12",
		email: "robin.swivel@example.com",
		firstName: "Robin",
		lastName: "Swivel",
		gender: "male",
		dateOfBirth: "2004-10-10",
		heightInCm: 183,
		weightInKg: 76,
		program: "dummy-learn-to-row",
		splitSeconds: 121,
	},
];

const GROUPS = [
	{ name: "Masters Squad", programs: ["dummy-masters"] },
	{ name: "Competitive Crew", programs: ["dummy-competitive"] },
	{ name: "Novices", programs: ["dummy-learn-to-row"] },
	{ name: "Club Racers", programs: ["dummy-masters", "dummy-competitive"] },
];

const BOATS = [
	{
		name: "Pun Intended",
		manufacturer: "hudson",
		seats: "1",
		rigging: "sculling",
		weightMinKg: 60,
		weightMaxKg: 80,
		preferredWeightUnit: "kilogram",
	},
	{
		name: "Catch Me If You Can",
		manufacturer: "fluidesign",
		seats: "2",
		rigging: "sculling",
		weightMinKg: 65,
		weightMaxKg: 85,
		preferredWeightUnit: "kilogram",
	},
	{
		name: "Feathered Friends",
		manufacturer: "kaschper_racing_shells_ltd",
		seats: "4",
		rigging: "sweep",
		weightMinKg: 70,
		weightMaxKg: 90,
		preferredWeightUnit: "pound",
	},
	{
		name: "Eight Expectations",
		manufacturer: "swift_racing_canada",
		seats: "8",
		rigging: "sweep",
		weightMinKg: 75,
		weightMaxKg: 95,
		preferredWeightUnit: "kilogram",
	},
] as const;

const ERGS = ["Erg 1", "Erg 2", "Erg 3", "Erg 4"];

const WORKOUTS: {
	description: string;
	daysFromToday: number;
	workoutType: WorkoutType;
	elapsedTime?: number;
	distance?: number;
	intervalCount: number;
	intensityCategory: IntensityCategory;
	zoneMinutes: { intensityCategory: IntensityCategory; minutes: number }[];
	fragments: {
		rate?: number;
		elapsedTime?: number;
		distance?: number;
		relativeTo: "2K" | "6K";
		relativeSplit: number;
	}[];
}[] = [
	{
		description: "2K test",
		daysFromToday: -42,
		workoutType: "distance",
		distance: 2000,
		intervalCount: 1,
		intensityCategory: "C1",
		zoneMinutes: [{ intensityCategory: "C1", minutes: 8 }],
		fragments: [],
	},
	{
		description: "6K test",
		daysFromToday: -28,
		workoutType: "distance",
		distance: 6000,
		intervalCount: 1,
		intensityCategory: "C2",
		zoneMinutes: [{ intensityCategory: "C2", minutes: 24 }],
		fragments: [],
	},
	{
		description: "3 x 10' at rate 20",
		daysFromToday: -10,
		workoutType: "time",
		elapsedTime: 30 * 60 * 1000,
		intervalCount: 3,
		intensityCategory: "C4",
		zoneMinutes: [
			{ intensityCategory: "C5", minutes: 10 },
			{ intensityCategory: "C4", minutes: 30 },
		],
		fragments: [
			{
				rate: 20,
				elapsedTime: 10 * 60 * 1000,
				relativeTo: "2K",
				relativeSplit: 14,
			},
		],
	},
	{
		description: "60' steady state",
		daysFromToday: 3,
		workoutType: "time",
		elapsedTime: 60 * 60 * 1000,
		intervalCount: 1,
		intensityCategory: "C6",
		zoneMinutes: [{ intensityCategory: "C6", minutes: 60 }],
		fragments: [
			{
				rate: 18,
				elapsedTime: 60 * 60 * 1000,
				relativeTo: "2K",
				relativeSplit: 22,
			},
		],
	},
];

const EVENTS: {
	type: EventType;
	title: string;
	description: string;
	daysFromToday: number;
	hours: number;
	allDay?: boolean;
	location: string;
	workout?: string;
	groups?: string[];
	volunteerSpots?: number;
	rsvps: [athlete: number, status: RsvpStatus][];
}[] = [
	{
		type: "training",
		title: "Saturday steady state",
		description: "Long and easy. Bring water and a sense of humour.",
		daysFromToday: 3,
		hours: 1.5,
		location: "Dummy Lake boathouse",
		workout: "60' steady state",
		rsvps: [
			[0, "yes"],
			[1, "yes"],
			[2, "maybe"],
			[3, "no"],
			[4, "yes"],
		],
	},
	{
		type: "training",
		title: "Novice erg session",
		description: "Technique first, splits later.",
		daysFromToday: 5,
		hours: 1,
		location: "Dummy Lake boathouse erg room",
		groups: ["Novices"],
		rsvps: [
			[7, "yes"],
			[8, "maybe"],
			[11, "yes"],
		],
	},
	{
		type: "volunteer",
		title: "Dock clean-up",
		description: "Many hands, light work, free doughnuts.",
		daysFromToday: 9,
		hours: 3,
		location: "Dummy Lake dock",
		volunteerSpots: 6,
		rsvps: [
			[0, "yes"],
			[6, "yes"],
			[9, "maybe"],
		],
	},
	{
		type: "regatta",
		title: "Prairie Pun Regatta",
		description: "A made-up regatta on a made-up lake.",
		daysFromToday: 20,
		hours: 0,
		allDay: true,
		location: "Imaginary Reservoir",
		groups: ["Competitive Crew", "Club Racers"],
		rsvps: [
			[1, "yes"],
			[5, "yes"],
			[10, "maybe"],
		],
	},
];

const CHATS: {
	group?: string;
	messages: { author: number; minutesAgo: number; text: string }[];
}[] = [
	{
		messages: [
			{
				author: 2,
				minutesAgo: 600,
				text: "Who's bringing the coffee to Saturday's row?",
			},
			{ author: 4, minutesAgo: 590, text: "I will. Oat milk this time." },
			{
				author: 6,
				minutesAgo: 300,
				text: "Reminder: the dock clean-up sign-up is on the calendar.",
			},
			{
				author: 3,
				minutesAgo: 120,
				text: "Erg 3 is making that clicking noise again.",
			},
		],
	},
	{
		group: "Competitive Crew",
		messages: [
			{ author: 5, minutesAgo: 400, text: "Great 6K pieces last week, all." },
			{
				author: 10,
				minutesAgo: 200,
				text: "Can we move Thursday's session to 6 am?",
			},
			{ author: 2, minutesAgo: 180, text: "Works for me." },
		],
	},
];

/**
 * Empty every table of the database at `unpooledUrl` and fill it with the
 * invented dataset above. Only ever call this on a throwaway branch.
 */
export async function replaceWithDummyData(unpooledUrl: string) {
	const db = new PrismaClient({
		adapter: new PrismaNeon({ connectionString: unpooledUrl }),
	});
	try {
		const tables = await db.$queryRaw<{ tablename: string }[]>`
			SELECT tablename::text FROM pg_tables
			WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
		if (tables.length > 0) {
			await db.$executeRawUnsafe(
				`TRUNCATE TABLE ${tables
					.map(
						({ tablename }) => `"public"."${tablename.replaceAll('"', '""')}"`,
					)
					.join(", ")} RESTART IDENTITY CASCADE`,
			);
		}

		const today = new Date();
		today.setUTCHours(13, 0, 0, 0);

		const programs = await Promise.all(
			PROGRAMS.map((program) =>
				db.program.create({
					data: {
						...program,
						organizationName: "RRC Dummy Club",
						startDate: new Date(today.getTime() - 90 * DAY),
						endDate: new Date(today.getTime() + 120 * DAY),
					},
				}),
			),
		);
		const programIds: Record<string, string> = Object.fromEntries(
			programs.map((program) => [program.rcaProgramId, program.id]),
		);

		const athletes = await Promise.all(
			ATHLETES.map(({ program, splitSeconds, ...athlete }, index) =>
				db.athlete.create({
					data: {
						...athlete,
						phone: `+1 306 555 01${String(index + 1).padStart(2, "0")}`,
						role: index === 0 ? "admin" : "member",
						dateOfBirth: new Date(athlete.dateOfBirth),
						dateJoined: new Date(today.getTime() - (400 + index * 30) * DAY),
					},
				}),
			),
		);
		await db.membership.createMany({
			data: ATHLETES.map((athlete, index) => ({
				athleteId: athletes[index].id,
				programId: programIds[athlete.program],
			})),
		});

		const groups = await Promise.all(
			GROUPS.map((group) =>
				db.group.create({
					data: {
						name: group.name,
						programs: {
							create: group.programs.map((program) => ({
								programId: programIds[program],
							})),
						},
					},
				}),
			),
		);
		const groupIds: Record<string, string> = Object.fromEntries(
			groups.map((group) => [group.name, group.id]),
		);

		const boats = await Promise.all(
			BOATS.map((boat) => db.boat.create({ data: boat })),
		);
		const ergs = await Promise.all(
			ERGS.map((name, index) =>
				db.erg.create({
					data: {
						name,
						manufacturer: "concept2",
						firmwareVersion: "1.0.0",
						hardwareVersion: "PM5",
						serialNumber: `DUMMY-${String(index + 1).padStart(4, "0")}`,
					},
				}),
			),
		);

		const workouts = await Promise.all(
			WORKOUTS.map(({ daysFromToday, zoneMinutes, fragments, ...workout }) =>
				db.workout.create({
					data: {
						...workout,
						startDate: new Date(today.getTime() + daysFromToday * DAY),
						zoneMinutes: { create: zoneMinutes },
						fragments: { create: fragments },
					},
				}),
			),
		);
		const workoutIds: Record<string, string> = Object.fromEntries(
			workouts.map((workout) => [workout.description, workout.id]),
		);

		for (const event of EVENTS) {
			const startAt = new Date(today.getTime() + event.daysFromToday * DAY);
			await db.event.create({
				data: {
					type: event.type,
					title: event.title,
					description: event.description,
					startAt,
					endAt: event.allDay
						? undefined
						: new Date(startAt.getTime() + event.hours * 60 * 60 * 1000),
					allDay: event.allDay ?? false,
					location: event.location,
					workoutId: event.workout && workoutIds[event.workout],
					audience: event.groups ? "groups" : "club",
					volunteerSpots: event.volunteerSpots,
					createdById: athletes[0].id,
					groups: {
						create: (event.groups ?? []).map((group) => ({
							groupId: groupIds[group],
						})),
					},
					rsvps: {
						create: event.rsvps.map(([athlete, status]) => ({
							athleteId: athletes[athlete].id,
							status,
						})),
					},
				},
			});
		}

		await db.activity.createMany({
			data: trainingHistory(
				today,
				athletes.map((athlete) => athlete.id),
				boats.map((boat) => boat.id),
				ergs.map((erg) => erg.id),
				workoutIds,
			),
		});

		for (const chat of CHATS) {
			await db.channel.create({
				data: {
					...(chat.group
						? { kind: "group", groupId: groupIds[chat.group] }
						: { id: EVERYONE_CHANNEL_ID, kind: "everyone" }),
					messages: {
						create: chat.messages.map((message) => ({
							authorUserId: ATHLETES[message.author].userId,
							text: message.text,
							createdAt: new Date(Date.now() - message.minutesAgo * 60 * 1000),
						})),
					},
				},
			});
		}
	} finally {
		await db.$disconnect();
	}
}

/**
 * Eight weeks of sessions for every athlete: a steady erg and a row on the
 * water each week, everyone's 2K and 6K tests, and one 2000 m interval session
 * that must not count as a 2K test.
 */
function trainingHistory(
	today: Date,
	athleteIds: string[],
	boatIds: string[],
	ergIds: string[],
	workoutIds: Record<string, string>,
): Prisma.activityCreateManyInput[] {
	let concept2ResultId = 900_000;

	const ergPiece = (
		athlete: number,
		daysFromToday: number,
		name: string,
		distance: number,
		elapsedSeconds: number,
		workoutType: string,
		workoutId?: string,
	): Prisma.activityCreateManyInput => {
		const startDate = new Date(today.getTime() + daysFromToday * DAY);
		concept2ResultId += 1;
		return {
			name,
			startDate,
			timezone: "America/Regina",
			workoutType: "distance",
			elapsedTime: elapsedSeconds * 1000,
			distance,
			type: "erg",
			athleteId: athleteIds[athlete],
			ergId: ergIds[athlete % ergIds.length],
			workoutId,
			conceptTwoId: BigInt(concept2ResultId),
			conceptTwoData: {
				id: concept2ResultId,
				user_id: 800_000 + athlete,
				date: startDate.toISOString().replace("T", " ").slice(0, 19),
				timezone: "America/Regina",
				date_utc: startDate.toISOString().replace("T", " ").slice(0, 19),
				distance,
				type: "rower",
				time: elapsedSeconds * 10,
				time_formatted: `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}.0`,
				workout_type: workoutType,
				source: "ErgData",
				weight_class: "H",
				verified: true,
				ranked: false,
				stroke_rate: distance === 10_000 ? 20 : 30,
				drag_factor: 120,
			},
		};
	};

	return ATHLETES.flatMap(({ splitSeconds }, athlete) => [
		...[8, 7, 6, 5, 4, 3, 2, 1].flatMap((weeksAgo) => [
			ergPiece(
				athlete,
				-7 * weeksAgo + (athlete % 3),
				"10K steady",
				10_000,
				20 * (splitSeconds + 18),
				"FixedDistanceSplits",
			),
			{
				name: "Morning row",
				startDate: new Date(
					today.getTime() + (-7 * weeksAgo + 3 + (athlete % 2)) * DAY,
				),
				timezone: "America/Regina",
				workoutType: "distance" as const,
				elapsedTime: (70 + athlete) * 60 * 1000,
				distance: 12_000,
				type: "water" as const,
				athleteId: athleteIds[athlete],
				boatId: boatIds[athlete % boatIds.length],
			},
		]),
		ergPiece(
			athlete,
			-42,
			"2K test",
			2000,
			4 * splitSeconds,
			"FixedDistanceSplits",
			workoutIds["2K test"],
		),
		ergPiece(
			athlete,
			-28,
			"6K test",
			6000,
			12 * (splitSeconds + 8),
			"FixedDistanceSplits",
			workoutIds["6K test"],
		),
		ergPiece(
			athlete,
			-7,
			"2K test",
			2000,
			4 * (splitSeconds - 1),
			"FixedDistanceSplits",
		),
		...(athlete === 1
			? [
					ergPiece(
						athlete,
						-14,
						"4 x 500m",
						2000,
						4 * (splitSeconds - 3),
						"FixedDistanceInterval",
					),
				]
			: []),
	]);
}
