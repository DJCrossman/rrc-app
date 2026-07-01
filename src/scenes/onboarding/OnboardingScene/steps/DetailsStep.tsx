"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { PhoneInput } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatGender } from "@/lib/formatters/formatGender";
import { trpcClient } from "@/lib/trpc/client";
import {
	type CompleteOnboarding,
	completeOnboardingSchema,
	GenderTypes,
} from "@/schemas";

export interface DetailsStepDefaults {
	firstName: string;
	lastName: string;
	nickname: string;
	phone: string;
	gender?: CompleteOnboarding["gender"];
	dateOfBirth: string;
}

interface DetailsStepProps {
	mode: "create" | "update";
	defaultValues: DetailsStepDefaults;
	onCompleted: () => Promise<void> | void;
	onBack?: () => void;
}

export function DetailsStep({
	mode,
	defaultValues,
	onCompleted,
	onBack,
}: DetailsStepProps) {
	const completeOnboarding = trpcClient.users.completeOnboarding.useMutation();
	const updateUserProfile = trpcClient.users.updateUserProfile.useMutation();
	const isSubmitting =
		completeOnboarding.isPending || updateUserProfile.isPending;

	const form = useForm<CompleteOnboarding>({
		resolver: zodResolver(completeOnboardingSchema),
		defaultValues: {
			firstName: defaultValues.firstName,
			lastName: defaultValues.lastName,
			nickname: defaultValues.nickname,
			phone: defaultValues.phone,
			dateOfBirth: defaultValues.dateOfBirth,
			gender: defaultValues.gender,
		},
	});

	const onSubmit: SubmitHandler<CompleteOnboarding> = async (data) => {
		try {
			if (mode === "create") {
				await completeOnboarding.mutateAsync(data);
			} else {
				await updateUserProfile.mutateAsync(data);
			}
			await onCompleted();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save your details",
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h2 className="text-2xl font-semibold">Your details</h2>
				<p className="text-muted-foreground">
					Tell us a bit about yourself to finish creating your profile.
				</p>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<FormField
						control={form.control}
						name="firstName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>First name</FormLabel>
								<FormControl>
									<Input autoFocus placeholder="First name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="lastName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Last name</FormLabel>
								<FormControl>
									<Input placeholder="Last name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="nickname"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Preferred name (optional)</FormLabel>
								<FormControl>
									<Input placeholder="What should we call you?" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="phone"
						render={() => (
							<FormItem>
								<FormLabel>Phone</FormLabel>
								<FormControl>
									<PhoneInput
										name="phone"
										placeholder="1 306 555 0123"
										control={form.control}
										defaultCountry="CA"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="gender"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Gender</FormLabel>
								<FormControl>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select gender" />
										</SelectTrigger>
										<SelectContent>
											{GenderTypes.map((gender) => (
												<SelectItem key={gender} value={gender}>
													{formatGender({ ...form.getValues(), gender })}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="dateOfBirth"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date of birth</FormLabel>
								<FormControl>
									<DateInput {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex items-center justify-between gap-2">
						{onBack ? (
							<Button
								type="button"
								variant="ghost"
								onClick={onBack}
								disabled={isSubmitting}
							>
								Back
							</Button>
						) : (
							<span />
						)}
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Saving…" : "Continue"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
