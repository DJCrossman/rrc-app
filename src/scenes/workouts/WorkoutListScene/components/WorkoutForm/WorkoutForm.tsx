"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { type CreateWorkout, workoutCoreSchema } from "@/schemas";

interface WorkoutFormProps {
	onSubmit: SubmitHandler<CreateWorkout>;
	onCancel?: (() => void) | string;
	defaultValues?: Partial<CreateWorkout>;
}

export function WorkoutForm({
	onSubmit,
	onCancel: cancelLinkOrAction,
	defaultValues,
}: WorkoutFormProps) {
	const form = useForm<CreateWorkout>({
		resolver: zodResolver(workoutCoreSchema),
		defaultValues: defaultValues || {
			description: "",
			startDate: undefined,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Workout Description"
									autoFocus
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="startDate"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Start Date</FormLabel>
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
							onClick={() => {
								cancelLinkOrAction();
							}}
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
