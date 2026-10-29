import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import { openFeedback, toReportedError } from "./feedback";

export function toastError(error: unknown) {
	toast.error(
		error instanceof Error ? error.message : "Something went wrong",
		isUnexpected(error)
			? {
					duration: 10_000,
					action: {
						label: "Report",
						onClick: () => openFeedback({ error: toReportedError(error) }),
					},
				}
			: undefined,
	);
}

export async function withErrorToast<T>(promise: Promise<T>): Promise<T> {
	try {
		return await promise;
	} catch (error) {
		toastError(error);
		throw error;
	}
}

function isUnexpected(error: unknown): error is Error {
	if (error instanceof TRPCClientError) {
		return error.data?.code === "INTERNAL_SERVER_ERROR";
	}
	return error instanceof Error;
}
