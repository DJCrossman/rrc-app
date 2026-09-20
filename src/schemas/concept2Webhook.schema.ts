import { z } from "zod";
import { concept2ActivitySchema } from "./concept2Activity.schema";

// Concept2 Logbook webhooks emit events of these types. The result body is
// sometimes inlined (added/updated) and sometimes only referenced by id
// (deleted) — we accept both shapes and fall back to fetching when needed.
// `user_id` only appears on the event itself in some payloads; when it does
// not, the inlined result carries it.
const concept2WebhookEventBodySchema = z.object({
	type: z.enum(["result-added", "result-updated", "result-deleted"]),
	user_id: z.number().int().optional(),
	result_id: z.number().int().optional(),
	result: concept2ActivitySchema.optional(),
});

// Concept2 documents the event wrapped in `data`, but sends it unwrapped in
// practice. Accept either rather than 400-ing on whichever we do not expect.
export const concept2WebhookEventSchema = z.preprocess((value) => {
	if (
		value &&
		typeof value === "object" &&
		!("type" in value) &&
		"data" in value
	) {
		return (value as { data: unknown }).data;
	}
	return value;
}, concept2WebhookEventBodySchema);

export type Concept2WebhookEvent = z.infer<typeof concept2WebhookEventSchema>;

export function getConcept2WebhookUserId(
	event: Concept2WebhookEvent,
): number | undefined {
	return event.user_id ?? event.result?.user_id;
}
