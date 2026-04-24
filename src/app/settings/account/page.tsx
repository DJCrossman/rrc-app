"use client";

import { useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc/client";
import { AccountSettingsScene } from "@/scenes/settings";

export default function AccountPage() {
	const queryClient = useQueryClient();
	const updateUserProfile = trpcClient.users.updateUserProfile.useMutation();

	return (
		<AccountSettingsScene
			onUpdateProfile={async (data) => {
				await updateUserProfile.mutateAsync(data);
				await queryClient.invalidateQueries();
			}}
		/>
	);
}
