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
import type { UpdateUser } from "@/schemas";
import { AccountForm } from "./components";

interface IProps {
	onUpdateProfile: (data: UpdateUser) => Promise<void>;
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
					user={user}
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
