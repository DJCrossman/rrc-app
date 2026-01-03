"use client";

import { useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "@/app/api/v1/users/actions";
import { AccountSettingsScene } from "@/scenes/settings";

export default function AccountPage() {
	const queryClient = useQueryClient();

	return (
		<AccountSettingsScene
			onUpdateProfile={async (data) => {
				await updateUserProfile(data);
				await queryClient.invalidateQueries();
			}}
		/>
	);
}
