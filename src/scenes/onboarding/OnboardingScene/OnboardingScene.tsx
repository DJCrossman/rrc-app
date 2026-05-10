"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { generateQueryKey } from "@/lib/keygen";
import { trpcClient } from "@/lib/trpc/client";
import {
	type CompleteOnboarding,
	completeOnboardingSchema,
	GenderTypes,
} from "@/schemas";

interface OnboardingSceneProps {
	defaultFirstName?: string;
	defaultLastName?: string;
}

export function OnboardingScene({
	defaultFirstName,
	defaultLastName,
}: OnboardingSceneProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const completeOnboarding = trpcClient.users.completeOnboarding.useMutation();

	const form = useForm<CompleteOnboarding>({
		resolver: zodResolver(completeOnboardingSchema),
		defaultValues: {
			firstName: defaultFirstName ?? "",
			lastName: defaultLastName ?? "",
			nickname: "",
			phone: "",
			dateOfBirth: "",
			gender: undefined,
		},
	});

	const onSubmit: SubmitHandler<CompleteOnboarding> = async (data) => {
		try {
			await completeOnboarding.mutateAsync(data);
			await queryClient.invalidateQueries({
				queryKey: generateQueryKey({ type: "currentUser" }),
			});
			router.replace("/");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to complete onboarding",
			);
		}
	};

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center p-6">
			<div className="mb-8 space-y-2 text-center">
				<h1 className="text-3xl font-semibold">Welcome to the club</h1>
				<p className="text-muted-foreground">
					Tell us a bit about yourself to finish creating your athlete profile.
				</p>
			</div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6 rounded-lg border bg-background p-6 shadow-sm"
				>
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
					<Button
						type="submit"
						className="w-full"
						disabled={completeOnboarding.isPending}
					>
						{completeOnboarding.isPending ? "Saving…" : "Complete onboarding"}
					</Button>
				</form>
			</Form>
		</div>
	);
}
