import type { RsvpStatus } from "@/schemas";

export function countResponses(
	rsvps: { athleteId: string; status: RsvpStatus }[],
	audienceIds: ReadonlySet<string>,
) {
	const responded = new Set(rsvps.map((rsvp) => rsvp.athleteId));
	let noReply = 0;
	for (const athleteId of audienceIds) {
		if (!responded.has(athleteId)) {
			noReply += 1;
		}
	}
	return {
		going: rsvps.filter((rsvp) => rsvp.status === "yes").length,
		maybe: rsvps.filter((rsvp) => rsvp.status === "maybe").length,
		no: rsvps.filter((rsvp) => rsvp.status === "no").length,
		noReply,
	};
}
