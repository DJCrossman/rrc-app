"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { generateQueryKey } from "@/lib/keygen";
import {
	isNotificationEnabled,
	NOTIFICATION_SCOPE_ALL,
	type NotificationPreferences,
} from "@/lib/notifications";
import { trpcClient } from "@/lib/trpc/client";

export type NotificationPermissionState =
	| NotificationPermission
	| "unsupported";

type BrowserPushState = {
	supported: boolean;
	permission: NotificationPermissionState;
	endpoint: string | null;
};

const BROWSER_STATE_KEY = generateQueryKey({ type: "browserPushState" });
const SERVICE_WORKER_URL = "/sw.js";
const EMPTY_PREFERENCES: NotificationPreferences = {};

export function useNotifications({
	enabled = true,
}: {
	enabled?: boolean;
} = {}) {
	const queryClient = useQueryClient();
	const utils = trpcClient.useUtils();
	const [isPending, setIsPending] = useState(false);

	const browserQuery = useQuery({
		queryKey: BROWSER_STATE_KEY,
		queryFn: readBrowserPushState,
		staleTime: Number.POSITIVE_INFINITY,
	});
	const statusQuery = trpcClient.notifications.getStatus.useQuery(undefined, {
		enabled,
	});
	const subscribe = trpcClient.notifications.subscribe.useMutation();
	const unsubscribe = trpcClient.notifications.unsubscribe.useMutation();
	const savePreference = trpcClient.notifications.setPreference.useMutation();

	const browser = browserQuery.data;
	const status = statusQuery.data;
	const preferences = status?.preferences ?? EMPTY_PREFERENCES;
	const subscribed = Boolean(
		browser?.endpoint && status?.endpoints.includes(browser.endpoint),
	);

	const setBrowserState = (state: BrowserPushState) =>
		queryClient.setQueryData(BROWSER_STATE_KEY, state);

	const setPreference = async (scope: string, isEnabled: boolean) => {
		utils.notifications.getStatus.setData(undefined, (previous) =>
			previous
				? {
						...previous,
						preferences: { ...previous.preferences, [scope]: isEnabled },
					}
				: previous,
		);
		try {
			await savePreference.mutateAsync({ scope, enabled: isEnabled });
		} catch (error) {
			toast.error("Couldn't save your notification settings", {
				description: errorMessage(error),
			});
		} finally {
			await utils.notifications.getStatus.invalidate();
		}
	};

	const enable = async (): Promise<boolean> => {
		const publicKey = status?.publicKey;
		if (!browser?.supported || !publicKey) return false;
		setIsPending(true);
		try {
			const permission = await Notification.requestPermission();
			if (permission !== "granted") {
				setBrowserState({ ...browser, permission });
				return false;
			}
			await navigator.serviceWorker.register(SERVICE_WORKER_URL);
			const registration = await navigator.serviceWorker.ready;
			const subscription = await getOrCreateSubscription(
				registration,
				publicKey,
			);
			const { keys } = subscription.toJSON();
			await subscribe.mutateAsync({
				endpoint: subscription.endpoint,
				keys: { p256dh: keys?.p256dh ?? "", auth: keys?.auth ?? "" },
				userAgent: navigator.userAgent,
			});
			if (!isNotificationEnabled(preferences)) {
				await savePreference.mutateAsync({
					scope: NOTIFICATION_SCOPE_ALL,
					enabled: true,
				});
			}
			setBrowserState({
				supported: true,
				permission,
				endpoint: subscription.endpoint,
			});
			await utils.notifications.getStatus.invalidate();
			return true;
		} catch (error) {
			toast.error("Couldn't turn on notifications", {
				description: errorMessage(error),
			});
			return false;
		} finally {
			setIsPending(false);
		}
	};

	const disable = async (): Promise<boolean> => {
		if (!browser?.supported) return false;
		setIsPending(true);
		try {
			const registration = await navigator.serviceWorker.getRegistration();
			const subscription = await registration?.pushManager.getSubscription();
			if (subscription) {
				await unsubscribe.mutateAsync({ endpoint: subscription.endpoint });
				await subscription.unsubscribe();
			}
			setBrowserState({ ...browser, endpoint: null });
			await utils.notifications.getStatus.invalidate();
			return true;
		} catch (error) {
			toast.error("Couldn't turn off notifications", {
				description: errorMessage(error),
			});
			return false;
		} finally {
			setIsPending(false);
		}
	};

	return {
		isLoading: browserQuery.isPending || (enabled && statusQuery.isPending),
		isError: statusQuery.isError,
		isPending,
		supported: browser?.supported ?? false,
		configured: status?.configured ?? false,
		permission: browser?.permission ?? "default",
		subscribed,
		preferences,
		isEnabled: (scope?: string) => isNotificationEnabled(preferences, scope),
		enable,
		disable,
		setPreference,
	};
}

async function readBrowserPushState(): Promise<BrowserPushState> {
	if (!isPushSupported()) {
		return { supported: false, permission: "unsupported", endpoint: null };
	}
	const permission = Notification.permission;
	try {
		const registration = await navigator.serviceWorker.getRegistration();
		const subscription = await registration?.pushManager.getSubscription();
		return {
			supported: true,
			permission,
			endpoint: subscription?.endpoint ?? null,
		};
	} catch {
		return { supported: true, permission, endpoint: null };
	}
}

function isPushSupported() {
	return (
		typeof window !== "undefined" &&
		window.isSecureContext &&
		"serviceWorker" in navigator &&
		"PushManager" in window &&
		"Notification" in window
	);
}

async function getOrCreateSubscription(
	registration: ServiceWorkerRegistration,
	publicKey: string,
) {
	const applicationServerKey = base64UrlToBytes(publicKey);
	const existing = await registration.pushManager.getSubscription();
	if (
		existing &&
		sameKey(existing.options.applicationServerKey, applicationServerKey)
	) {
		return existing;
	}
	await existing?.unsubscribe();
	return registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey,
	});
}

function base64UrlToBytes(value: string) {
	const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
	return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function sameKey(current: ArrayBuffer | null, expected: Uint8Array) {
	if (!current) return false;
	const bytes = new Uint8Array(current);
	return (
		bytes.length === expected.length &&
		bytes.every((byte, index) => byte === expected[index])
	);
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}
