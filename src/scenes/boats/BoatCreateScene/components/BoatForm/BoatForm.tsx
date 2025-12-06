"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combo-box";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
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
import {
	formatManufacturer,
	formatSeatSetup,
	formatWeight,
} from "@/lib/formatters";
import {
	type CreateBoat,
	createBoatSchema,
	ManufacturerTypes,
	RiggingTypes,
	SeatTypes,
	WeightUnitTypes,
} from "@/schemas/boat.schema";

interface BoatFormProps {
	onSubmit: SubmitHandler<CreateBoat>;
	onCancel?: (() => void) | string;
}

export function BoatForm({
	onSubmit,
	onCancel: cancelLinkOrAction,
}: BoatFormProps) {
	const form = useForm<CreateBoat>({
		resolver: zodResolver(createBoatSchema),
		defaultValues: {
			name: "",
			manufacturer: undefined,
			seats: "1",
			rigging: "sculling",
			weightRange: { min: 120, max: 180, unit: "pound" },
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
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Boat Name" autoFocus {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="manufacturer"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Manufacturer</FormLabel>
							<FormControl>
								<Combobox
									value={field.value}
									values={ManufacturerTypes.map((manufacturer) => ({
										value: manufacturer,
										label: formatManufacturer(manufacturer),
									}))}
									searchPlaceholder="Search manufacturers..."
									selectPlaceholder="Select manufacturer..."
									emptyText="No manufacturers found."
									onValueChange={(value) => {
										field.onChange(value);
										field.onBlur();
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex gap-4">
					<FormField
						control={form.control}
						name="seats"
						render={({ field }) => (
							<FormItem className="md:w-1/2">
								<FormLabel>Seats</FormLabel>
								<FormControl>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select Seats" />
										</SelectTrigger>
										<SelectContent>
											{SeatTypes.map((seat) => (
												<SelectItem key={seat} value={seat}>
													{formatSeatSetup({
														seats: seat,
														rigging: form.watch("rigging"),
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
						name="rigging"
						render={({ field }) => (
							<FormItem className="md:w-1/2">
								<FormLabel>Rigging</FormLabel>
								<FormControl>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select Rigging" />
										</SelectTrigger>
										<SelectContent>
											{RiggingTypes.map((rigging) => (
												<SelectItem key={rigging} value={rigging}>
													{rigging.charAt(0).toUpperCase() + rigging.slice(1)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="weightRange"
					render={() => (
						<FormItem>
							<FormLabel>Weight Range</FormLabel>
							<FormControl>
								<DualRangeSlider
									label={(value) =>
										value &&
										formatWeight({
											value,
											unit: form.watch("weightRange.unit"),
										})
									}
									labelPosition="bottom"
									onValueChange={(value) => {
										form.setValue("weightRange", {
											min: value[0],
											max: value[1],
											unit: form.watch("weightRange.unit"),
										});
									}}
									value={[
										form.watch("weightRange.min"),
										form.watch("weightRange.max"),
									]}
									min={form.watch("weightRange.unit") === "kilogram" ? 40 : 100}
									max={
										form.watch("weightRange.unit") === "kilogram" ? 120 : 250
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="weightRange.unit"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Weight Unit</FormLabel>
							<FormControl>
								<Select
									onValueChange={(data) => {
										if (data === "kilogram") {
											// convert to kilogram
											form.setValue(
												"weightRange.min",
												Math.round(form.watch("weightRange.min") * 0.453592),
											);
											form.setValue(
												"weightRange.max",
												Math.round(form.watch("weightRange.max") * 0.453592),
											);
										} else {
											// convert to pound
											form.setValue(
												"weightRange.min",
												Math.round(form.watch("weightRange.min") * 2.20462),
											);
											form.setValue(
												"weightRange.max",
												Math.round(form.watch("weightRange.max") * 2.20462),
											);
										}
										field.onChange(data);
									}}
									defaultValue={field.value}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select Unit" />
									</SelectTrigger>
									<SelectContent>
										{WeightUnitTypes.map((unit) => (
											<SelectItem key={unit} value={unit}>
												{unit.charAt(0).toUpperCase() + unit.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
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
