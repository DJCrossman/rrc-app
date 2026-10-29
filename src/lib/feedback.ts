import { TRPCClientError } from "@trpc/client";
import type { ReportedError } from "@/schemas";

export type FeedbackRequest = {
	id: number;
	pagePath: string;
	error?: ReportedError;
};

type FeedbackState = { open: boolean; request: FeedbackRequest | null };

let state: FeedbackState = { open: false, request: null };
const listeners = new Set<() => void>();

export function openFeedback({ error }: { error?: ReportedError } = {}) {
	setState({
		open: true,
		request: {
			id: (state.request?.id ?? 0) + 1,
			pagePath: `${window.location.pathname}${window.location.search}`,
			error,
		},
	});
}

export function closeFeedback() {
	setState({ ...state, open: false });
}

export function subscribeToFeedback(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getFeedbackState() {
	return state;
}

export function toReportedError(
	error: Error & { digest?: string },
): ReportedError {
	if (error instanceof TRPCClientError) {
		return {
			message: error.message,
			procedure: error.data?.path,
			stack: error.data?.stack,
		};
	}
	return { message: error.message, digest: error.digest, stack: error.stack };
}

function setState(next: FeedbackState) {
	state = next;
	for (const listener of listeners) listener();
}
