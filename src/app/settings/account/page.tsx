"use client";

import { useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "@/app/api/v1/users/actions";
import { AccountSettingsScene } from "@/scenes/settings";
import type { User } from "@/schemas";

export default function AccountPage() {
	const queryClient = useQueryClient();

	const handleUpdateProfile = async (data: Partial<User>) => {
		await updateUserProfile(data);
		await queryClient.invalidateQueries();
	};

	return <AccountSettingsScene onUpdateProfile={handleUpdateProfile} />;
}
