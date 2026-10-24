const DEFAULT_NOTIFICATION = {
	title: "Regina Rowing Club",
	body: "",
	url: "/",
	icon: "/logo.png",
};

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
	const notification = readNotification(event);
	event.waitUntil(
		self.registration.showNotification(notification.title, {
			body: notification.body,
			icon: notification.icon,
			badge: "/logo.png",
			tag: notification.tag,
			renotify: Boolean(notification.tag),
			data: { url: notification.url },
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const url = new URL(event.notification.data?.url ?? "/", self.location.origin)
		.href;
	event.waitUntil(focusOrOpen(url));
});

function readNotification(event) {
	if (!event.data) return DEFAULT_NOTIFICATION;
	try {
		return { ...DEFAULT_NOTIFICATION, ...event.data.json() };
	} catch {
		return { ...DEFAULT_NOTIFICATION, body: event.data.text() };
	}
}

async function focusOrOpen(url) {
	const windows = await self.clients.matchAll({
		type: "window",
		includeUncontrolled: true,
	});
	const existing =
		windows.find((client) => client.url === url) ??
		windows.find(
			(client) => new URL(client.url).origin === self.location.origin,
		);
	if (!existing) return self.clients.openWindow(url);

	const focused = await existing.focus();
	if (focused.url === url || !("navigate" in focused)) return focused;
	return focused.navigate(url).catch(() => focused);
}
