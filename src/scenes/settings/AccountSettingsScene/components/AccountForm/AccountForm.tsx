"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { GenderTypes, type UpdateUser, updateUserSchema } from "@/schemas";

type AccountFormData = UpdateUser;

interface AccountFormProps {
	user: AccountFormData;
	onSubmit: (data: AccountFormData) => Promise<void>;
}

export function AccountForm({
	user,
	onSubmit: handleSubmit,
}: AccountFormProps) {
	const form = useForm<AccountFormData>({
		resolver: zodResolver(updateUserSchema),
		defaultValues: {
			id: user.id,
			firstName: user.firstName ?? "",
			lastName: user.lastName ?? "",
			nickname: user.nickname ?? "",
			phone: user.phone ? `+${user.phone.replace(/\D/g, "")}` : "",
			gender: user.gender ?? undefined,
			dateOfBirth: user.dateOfBirth ?? "",
			heightInCm: user.heightInCm ?? undefined,
			weightInKg: user.weightInKg ?? undefined,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="firstName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>First Name</FormLabel>
							<FormControl>
								<Input placeholder="John" {...field} />
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
							<FormLabel>Last Name</FormLabel>
							<FormControl>
								<Input placeholder="Doe" {...field} />
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
							<FormLabel>Preferred Name</FormLabel>
							<FormControl>
								<Input placeholder="Johnny" {...field} />
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
									placeholder="1 555 123 4567"
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
										<SelectValue placeholder="Select Gender" />
									</SelectTrigger>
									<SelectContent>
										{GenderTypes.map((gender) => (
											<SelectItem key={gender} value={gender}>
												{formatGender({
													dateOfBirth: form.getValues().dateOfBirth ?? "",
													gender,
												})}
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
				<FormField
					control={form.control}
					name="heightInCm"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Height (cm)</FormLabel>
							<FormControl>
								<Input
									type="number"
									placeholder="180"
									{...field}
									value={field.value ?? ""}
									onChange={(e) =>
										field.onChange(
											e.target.value ? Number(e.target.value) : undefined,
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="weightInKg"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Weight (kg)</FormLabel>
							<FormControl>
								<Input
									type="number"
									placeholder="75"
									{...field}
									value={field.value ?? ""}
									onChange={(e) =>
										field.onChange(
											e.target.value ? Number(e.target.value) : undefined,
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-end">
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		</Form>
	);
}
