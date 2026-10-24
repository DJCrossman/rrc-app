"use client";

import { ChevronDownIcon } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useDrawerContentContainer } from "@/components/ui/drawer";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EventFormInput } from "@/schemas";

export const EventDetailsFields = () => {
	const drawerContainer = useDrawerContentContainer();
	const [isDateOpen, setIsDateOpen] = useState(false);
	const { control, watch } = useFormContext<EventFormInput>();
	const [type, allDay, audience] = watch(["type", "allDay", "audience"]);

	return (
		<>
			<FormField
				control={control}
				name="title"
				render={({ field }) => (
					<FormItem>
						<FormLabel isRequired>Title</FormLabel>
						<FormControl>
							<Input placeholder="Morning row" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="date"
				render={({ field }) => {
					const selected = DateTime.fromISO(field.value);
					return (
						<FormItem>
							<FormLabel isRequired>Date</FormLabel>
							<Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											type="button"
											variant="outline"
											className="w-full justify-between font-normal"
										>
											{selected.isValid
												? selected.toLocaleString(DateTime.DATE_HUGE)
												: "Select date"}
											<ChevronDownIcon />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent
									className="w-auto overflow-hidden p-0"
									align="start"
									container={drawerContainer ?? undefined}
								>
									<Calendar
										mode="single"
										captionLayout="dropdown"
										selected={
											selected.isValid ? selected.toJSDate() : undefined
										}
										defaultMonth={
											selected.isValid ? selected.toJSDate() : undefined
										}
										onSelect={(day) => {
											if (day) {
												field.onChange(DateTime.fromJSDate(day).toISODate());
											}
											setIsDateOpen(false);
										}}
									/>
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
			<FormField
				control={control}
				name="allDay"
				render={({ field }) => (
					<FormItem className="flex items-center gap-2">
						<FormControl>
							<Checkbox
								checked={field.value}
								onCheckedChange={(checked) => field.onChange(checked === true)}
							/>
						</FormControl>
						<FormLabel className="font-normal">All day</FormLabel>
					</FormItem>
				)}
			/>
			<div hidden={allDay} className="grid grid-cols-2 gap-4">
				<FormField
					control={control}
					name="startTime"
					render={({ field }) => (
						<FormItem>
							<FormLabel isRequired>Start</FormLabel>
							<FormControl>
								<Input type="time" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name="endTime"
					render={({ field }) => (
						<FormItem>
							<FormLabel>End</FormLabel>
							<FormControl>
								<Input type="time" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<FormField
				control={control}
				name="location"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Location</FormLabel>
						<FormControl>
							<Input placeholder="Boathouse" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="audience"
				render={({ field }) => (
					<FormItem>
						<FormLabel isRequired>Audience</FormLabel>
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
								<ToggleGroupItem value="club">Club-wide</ToggleGroupItem>
								<ToggleGroupItem value="groups">Groups</ToggleGroupItem>
							</ToggleGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="groupIds"
				render={({ field }) => (
					<FormItem hidden={audience !== "groups"}>
						<FormLabel isRequired>Groups</FormLabel>
						<FormControl>
							<MultiSelect
								creatable
								hidePlaceholderWhenSelected
								placeholder="Type a group and press Enter"
								value={field.value.map((groupId) => ({
									value: groupId,
									label: groupId,
								}))}
								onChange={(options) =>
									field.onChange(options.map(({ value }) => value))
								}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="volunteerSpots"
				render={({ field }) => (
					<FormItem hidden={type !== "volunteer"}>
						<FormLabel isRequired>Volunteer spots</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={1}
								step={1}
								placeholder="e.g. 2"
								value={field.value ?? ""}
								onChange={(event) =>
									field.onChange(
										event.target.value === ""
											? null
											: Number(event.target.value),
									)
								}
								onBlur={field.onBlur}
								name={field.name}
								ref={field.ref}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Notes</FormLabel>
						<FormControl>
							<Textarea placeholder="Anything people should know" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
