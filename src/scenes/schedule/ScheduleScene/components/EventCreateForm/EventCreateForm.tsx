"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EVENT_TYPE_LABELS } from "@/lib/schedule/event-labels";
import {
	type CreateEvent,
	type EventFormInput,
	EventTypes,
	eventFormSchema,
} from "@/schemas";
import { EventDetailsFields } from "../EventDetailsFields/EventDetailsFields";
import { WorkoutFields } from "../WorkoutFields/WorkoutFields";

const EVENT_FIELDS = [
	"type",
	"title",
	"description",
	"date",
	"allDay",
	"startTime",
	"endTime",
	"location",
	"audience",
	"groupIds",
	"volunteerSpots",
] as const;

interface EventCreateFormProps {
	defaultValues: EventFormInput;
	onSubmit: (input: CreateEvent, values: EventFormInput) => Promise<void>;
	onCancel: () => void;
	afterType?: ReactNode;
}

export function EventCreateForm({
	defaultValues,
	onSubmit,
	onCancel,
	afterType,
}: EventCreateFormProps) {
	const [step, setStep] = useState<"event" | "workout">("event");
	const [isParsing, setIsParsing] = useState(false);
	const form = useForm<EventFormInput>({
		resolver: zodResolver(eventFormSchema, undefined, { raw: true }),
		defaultValues,
	});
	const isTraining = form.watch("type") === "training";

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(
					(values) => onSubmit(eventFormSchema.parse(values), values),
					(errors) =>
						setStep(
							EVENT_FIELDS.some((field) => errors[field]) ? "event" : "workout",
						),
				)}
				className="space-y-6"
			>
				<div hidden={step !== "event"} className="space-y-6">
					<FormField
						control={form.control}
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>Type</FormLabel>
								<FormControl>
									<ToggleGroup
										type="single"
										variant="outline"
										value={field.value}
										onValueChange={(value) => {
											if (value) field.onChange(value);
										}}
										className="w-full"
									>
										{EventTypes.map((eventType) => (
											<ToggleGroupItem key={eventType} value={eventType}>
												{EVENT_TYPE_LABELS[eventType]}
											</ToggleGroupItem>
										))}
									</ToggleGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{afterType}
					<EventDetailsFields />
				</div>
				<div hidden={step !== "workout"} className="space-y-6">
					<WorkoutFields isParsing={isParsing} onParsingChange={setIsParsing} />
				</div>
				<div className="flex items-center justify-between gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={step === "workout" ? () => setStep("event") : onCancel}
					>
						{step === "workout" ? "Back" : "Cancel"}
					</Button>
					{step === "workout" && (
						<Button
							type="button"
							variant="ghost"
							className="ml-auto"
							disabled={form.formState.isSubmitting || isParsing}
							onClick={(event) => {
								form.setValue("hasWorkout", false);
								event.currentTarget.form?.requestSubmit();
							}}
						>
							Skip for now
						</Button>
					)}
					{isTraining && step === "event" ? (
						<Button
							key="next"
							type="button"
							onClick={async () => {
								if (await form.trigger([...EVENT_FIELDS])) {
									setStep("workout");
								}
							}}
						>
							Next
						</Button>
					) : (
						<Button
							key="save"
							type="submit"
							onClick={() => form.setValue("hasWorkout", true)}
							disabled={form.formState.isSubmitting || isParsing}
						>
							Save
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
}
