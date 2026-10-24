import { toast } from "sonner";

export async function withErrorToast<T>(promise: Promise<T>): Promise<T> {
	try {
		return await promise;
	} catch (error) {
		toast.error(
			error instanceof Error ? error.message : "Something went wrong",
		);
		throw error;
	}
}
