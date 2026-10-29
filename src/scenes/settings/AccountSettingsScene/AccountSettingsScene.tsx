"use client";

import { UserProfile } from "@clerk/nextjs";
import { DateTime } from "luxon";
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
	const { user, hasAthlete } = useCurrentUser();

	if (!hasAthlete) {
		return (
			<UserProfile
				routing="hash"
				appearance={{
					variables: {
						colorBackground: "#09090b",
						colorInputBackground: "#18181b",
						colorInputText: "#fafafa",
						colorText: "#fafafa",
						colorTextSecondary: "#a1a1aa",
						colorPrimary: "#fafafa",
						colorNeutral: "#fafafa",
					},
				}}
			/>
		);
	}

	const initials = [user.firstName, user.lastName]
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
	const memberSince =
		user.dateJoined &&
		DateTime.fromISO(user.dateJoined).toLocaleString({
			month: "long",
			year: "numeric",
		});

	return (
		<>
			<div className="mb-4 flex items-center gap-4 md:hidden">
				<span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-2xl font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
					{initials}
				</span>
				<div className="min-w-0">
					<p className="truncate text-xl font-bold tracking-tight">
						{[user.firstName, user.lastName].filter(Boolean).join(" ")}
					</p>
					{memberSince && (
						<p className="text-[15px] text-muted-foreground">
							Member since {memberSince}
						</p>
					)}
				</div>
			</div>
			<Card>
				<CardHeader className="max-md:hidden">
					<CardTitle>My Account</CardTitle>
					<CardDescription>
						Manage your personal information and preferences
					</CardDescription>
				</CardHeader>
				<CardContent className="max-md:px-4">
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
		</>
	);
};
