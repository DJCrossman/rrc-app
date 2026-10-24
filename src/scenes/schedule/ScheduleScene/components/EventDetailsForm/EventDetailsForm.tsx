"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { ScheduleEvent } from "@/lib/trpc/types";
import {
	type CreateEvent,
	type EventFormInput,
	eventFormSchema,
} from "@/schemas";
import { getEventFormValues } from "../../utils/getEventFormValues";
import { EventDetailsFields } from "../EventDetailsFields/EventDetailsFields";

interface EventDetailsFormProps {
	event: ScheduleEvent;
	onSubmit: (input: CreateEvent) => Promise<void>;
	onCancel: () => void;
}

export function EventDetailsForm({
	event,
	onSubmit,
	onCancel,
}: EventDetailsFormProps) {
	const form = useForm<EventFormInput>({
		resolver: zodResolver(eventFormSchema, undefined, { raw: true }),
		defaultValues: getEventFormValues(event),
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((values) =>
					onSubmit(eventFormSchema.parse(values)),
				)}
				className="space-y-6"
			>
				<EventDetailsFields />
				<div className="flex items-center justify-between gap-4">
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
