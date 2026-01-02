"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
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
import {
	type CreateAthlete,
	createAthleteSchema,
	GenderTypes,
} from "@/schemas";

interface AthleteFormProps {
	initialValues?: Partial<CreateAthlete>;
	onSubmit: SubmitHandler<CreateAthlete>;
	onCancel?: (() => void) | string;
}

export function AthleteForm({
	initialValues,
	onSubmit,
	onCancel: cancelLinkOrAction,
}: AthleteFormProps) {
	const form = useForm<CreateAthlete>({
		resolver: zodResolver(createAthleteSchema),
		defaultValues: {
			firstName: initialValues?.firstName ?? "",
			lastName: initialValues?.lastName ?? "",
			nickname: initialValues?.nickname ?? "",
			phone: initialValues?.phone ?? "",
			dateOfBirth: initialValues?.dateOfBirth ?? "",
			dateJoined: initialValues?.dateJoined ?? "",
			gender: initialValues?.gender ?? undefined,
			roles: ["athlete"],
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<h2 className="text-xl font-bold mb-4">Contact Information</h2>
				<FormField
					control={form.control}
					name="firstName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>First name</FormLabel>
							<FormControl>
								<Input placeholder="Athlete First Name" autoFocus {...field} />
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
								<Input placeholder="Athlete Last Name" {...field} />
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
							<FormLabel>Preferred name</FormLabel>
							<FormControl>
								<Input placeholder="Athlete Preferred Name" {...field} />
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
									placeholder="1 306 777 7777"
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
					name="dateJoined"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Date Joined</FormLabel>
							<FormControl>
								<DateInput {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<h2 className="text-xl font-bold mb-4">Demographics</h2>
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
										<SelectValue placeholder="Select Gender" />
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
							<FormLabel>Date of Birth</FormLabel>
							<FormControl>
								<DateInput {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-between gap-4">
					{typeof cancelLinkOrAction === "string" && (
						<Button variant="outline" asChild>
							<a href={cancelLinkOrAction}>Cancel</a>
						</Button>
					)}
					{typeof cancelLinkOrAction === "function" && (
						<Button
							variant="outline"
							type="button"
							onClick={() => cancelLinkOrAction()}
						>
							Cancel
						</Button>
					)}
					<Button type="submit">Save</Button>
				</div>
			</form>
		</Form>
	);
}
