import { z } from "zod";
import { isPushServiceEndpoint } from "@/lib/notifications";

export const notificationScopeSchema = z
	.string()
	.regex(
		/^(all|schedule|channel:[A-Za-z0-9_-]{1,64})$/,
		"Unknown notification scope",
	);

export const subscribeToPushSchema = z.object({
	endpoint: z
		.string()
		.max(2048)
		.refine(isPushServiceEndpoint, "Unsupported push service"),
	keys: z.object({
		p256dh: z.string().min(1).max(256),
		auth: z.string().min(1).max(256),
	}),
	userAgent: z
		.string()
		.optional()
		.transform((value) => value?.slice(0, 512)),
});

export type SubscribeToPush = z.infer<typeof subscribeToPushSchema>;

export const unsubscribeFromPushSchema = z.object({
	endpoint: z.string().max(2048),
});

export type UnsubscribeFromPush = z.infer<typeof unsubscribeFromPushSchema>;

export const setNotificationPreferenceSchema = z.object({
	scope: notificationScopeSchema,
	enabled: z.boolean(),
});

export type SetNotificationPreference = z.infer<
	typeof setNotificationPreferenceSchema
>;
