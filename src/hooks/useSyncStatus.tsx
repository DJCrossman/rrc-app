"use client";

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { trpcClient } from "@/lib/trpc/client";

export type SyncSource = "strava" | "concept2";

type SyncStatusContextValue = {
	runningSources: Set<SyncSource>;
	cooldownSources: Set<SyncSource>;
	cooldownMs: number;
	cooldownEndsAt: (source: SyncSource) => number | null;
};

export function SyncStatusProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const pending = trpcClient.activities.getPendingInboxBatches.useQuery(
		undefined,
		{
			refetchInterval: (query) =>
				(query.state.data?.data.length ?? 0) > 0
					? POLL_ACTIVE_MS
					: POLL_IDLE_MS,
			refetchIntervalInBackground: true,
		},
	);

	const latestBySource = pending.data?.latestBySource;
	const [now, setNow] = useState(() => Date.now());

	const cooldownEndsAtMap = useMemo(() => {
		const map = new Map<SyncSource, number>();
		for (const source of SOURCES) {
			const ts = latestBySource?.[source];
			if (!ts) continue;
			map.set(source, new Date(ts).getTime() + COOLDOWN_MS);
		}
		return map;
	}, [latestBySource]);

	const value = useMemo<SyncStatusContextValue>(() => {
		const runningSources = new Set<SyncSource>();
		for (const batch of pending.data?.data ?? []) {
			if (batch.source === "strava" || batch.source === "concept2") {
				runningSources.add(batch.source);
			}
		}
		const cooldownSources = new Set<SyncSource>();
		for (const [source, endsAt] of cooldownEndsAtMap) {
			if (endsAt > now) cooldownSources.add(source);
		}
		return {
			runningSources,
			cooldownSources,
			cooldownMs: COOLDOWN_MS,
			cooldownEndsAt: (source) => cooldownEndsAtMap.get(source) ?? null,
		};
	}, [pending.data, cooldownEndsAtMap, now]);

	useEffect(() => {
		let soonestEnd = Number.POSITIVE_INFINITY;
		for (const endsAt of cooldownEndsAtMap.values()) {
			if (endsAt > Date.now() && endsAt < soonestEnd) soonestEnd = endsAt;
		}
		if (!Number.isFinite(soonestEnd)) return;
		const wait = Math.max(soonestEnd - Date.now(), 0) + 50;
		const handle = setTimeout(() => setNow(Date.now()), wait);
		return () => clearTimeout(handle);
	}, [cooldownEndsAtMap]);

	const previousRef = useRef<Set<SyncSource>>(new Set());
	useEffect(() => {
		const current = value.runningSources;
		const previous = previousRef.current;

		for (const source of current) {
			if (!previous.has(source)) {
				toast.loading(`Syncing ${SOURCE_LABEL[source]} activities…`, {
					id: toastId(source),
					duration: Number.POSITIVE_INFINITY,
				});
			}
		}
		for (const source of previous) {
			if (!current.has(source)) {
				toast.dismiss(toastId(source));
			}
		}

		previousRef.current = current;
	}, [value.runningSources]);

	return (
		<SyncStatusContext.Provider value={value}>
			{children}
		</SyncStatusContext.Provider>
	);
}

export function useSyncStatus(): SyncStatusContextValue {
	const ctx = useContext(SyncStatusContext);
	if (!ctx) {
		throw new Error("useSyncStatus must be used within a SyncStatusProvider");
	}
	return ctx;
}

const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);

const POLL_ACTIVE_MS = 3000;
const POLL_IDLE_MS = 30000;
const COOLDOWN_MS = 60 * 1000;

const SOURCES: SyncSource[] = ["strava", "concept2"];

const SOURCE_LABEL: Record<SyncSource, string> = {
	strava: "Strava",
	concept2: "Concept2",
};

const toastId = (source: SyncSource) => `sync-${source}`;
