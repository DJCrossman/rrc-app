"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Programs } from "@/lib/trpc/types";
import { type GroupFormValues, groupFormSchema } from "@/schemas";
import { ProgramRuleChips } from "./ProgramRuleChips";

interface GroupFormProps {
	initialValues?: GroupFormValues;
	programs: Programs;
	onSubmit: (data: GroupFormValues) => Promise<void> | void;
	onCancel: () => void;
}

export function GroupForm({
	initialValues,
	programs,
	onSubmit,
	onCancel,
}: GroupFormProps) {
	const form = useForm<GroupFormValues>({
		resolver: zodResolver(groupFormSchema),
		defaultValues: initialValues ?? {
			name: "",
			programIds: [],
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel isRequired>Name</FormLabel>
							<FormControl>
								<Input placeholder="e.g. Masters" autoFocus {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="programIds"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Auto-include RCA memberships</FormLabel>
							<FormDescription>
								Anyone with an active membership of these types joins
								automatically.
							</FormDescription>
							<ProgramRuleChips
								programs={programs}
								value={field.value}
								onChange={field.onChange}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-between gap-4">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit" disabled={form.formState.isSubmitting}>
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
}
