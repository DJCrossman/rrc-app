"use client";

import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useAuth";
import type { UpdateAthlete } from "@/schemas";
import { AccountForm } from "./components";

interface IProps {
	onUpdateProfile: (data: UpdateAthlete) => Promise<void>;
}

export const AccountSettingsScene = ({ onUpdateProfile }: IProps) => {
	const { user } = useCurrentUser();

	return (
		<Card>
			<CardHeader>
				<CardTitle>My Account</CardTitle>
				<CardDescription>
					Manage your personal information and preferences
				</CardDescription>
			</CardHeader>
			<CardContent>
				<AccountForm
					user={{
						...user,
						nickname: user.nickname ?? undefined,
						email: user.email ?? undefined,
						dateJoined: user.dateJoined ?? undefined,
						heightInCm: user.heightInCm ?? undefined,
						weightInKg: user.weightInKg ?? undefined,
					}}
					onSubmit={async (data) => {
						try {
							await onUpdateProfile(data);
							toast.success("Profile updated successfully");
						} catch {
							toast.error("Failed to update profile");
						}
					}}
				/>
			</CardContent>
		</Card>
	);
};
