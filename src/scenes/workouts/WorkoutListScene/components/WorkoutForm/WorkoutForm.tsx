"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { Fragment, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import type { ParseDescriptionResult } from "@/app/api/v1/workouts/parse-description/route";
import type { UploadWorkoutScreenshotResult } from "@/app/api/v1/workouts/screenshot/route";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useDrawerContentContainer } from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
	type CreateWorkout,
	type IntensityCategory,
	workoutCoreSchema,
} from "@/schemas";
import {
	intensityActiveSelectorMap,
	intensityColorMap,
} from "../../utils/intensityColorMap";

const formSchema = z
	.object({ workouts: z.array(workoutCoreSchema) })
	.superRefine((data, ctx) => {
		data.workouts.forEach((w, i) => {
			if (w.workoutType === "distance" && !w.distance) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Distance is required",
					path: ["workouts", i, "distance"],
				});
			}
			if (w.workoutType === "time" && !w.elapsedTime) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Elapsed time is required",
					path: ["workouts", i, "elapsedTime"],
				});
			}
		});
	});

type WorkoutFormInput = z.input<typeof formSchema>;
type WorkoutFormOutput = z.output<typeof formSchema>;

interface WorkoutFormProps {
	defaultValues?: { workouts: Partial<CreateWorkout>[] };
	onSubmit: SubmitHandler<{ workouts: CreateWorkout[] }>;
	onUploadWorkoutScreenshot?: (
		file: File,
	) => Promise<UploadWorkoutScreenshotResult>;
	onParseDescription: (description: string) => Promise<ParseDescriptionResult>;
	onCancel?: (() => void) | string;
}

const WORKOUT_TYPE_OPTIONS = [
	{ value: "time", label: "Time" },
	{ value: "distance", label: "Distance" },
] as const;

const INTENSITY_VALUES: IntensityCategory[] = [
	"C1",
	"C2",
	"C3",
	"C4",
	"C5",
	"C6",
];

export function WorkoutForm({
	onSubmit,
	onUploadWorkoutScreenshot,
	onParseDescription,
	onCancel: cancelLinkOrAction,
	defaultValues,
}: WorkoutFormProps) {
	const isAIEnabled = !!onUploadWorkoutScreenshot;
	const [isCreatingManually, setIsCreatingManually] = useState(!isAIEnabled);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [parsingIndex, setParsingIndex] = useState<number | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);
	const [openDateIndex, setOpenDateIndex] = useState<number | null>(null);
	const drawerContainer = useDrawerContentContainer();

	const form = useForm<WorkoutFormInput, unknown, WorkoutFormOutput>({
		resolver: zodResolver(formSchema),
		defaultValues: defaultValues || {
			workouts: [
				{
					description: "",
					startDate: undefined,
					intensityCategory: "C6",
					activityType:
						DateTime.now().month >= 5 && DateTime.now().month <= 9
							? "water"
							: "erg",
					workoutType: "time",
					intervalCount: 1,
				},
			],
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				{!isCreatingManually && onUploadWorkoutScreenshot && (
					<div className="space-y-2">
						<FormLabel>Upload Calendar Screenshot</FormLabel>
						<div className="flex items-center gap-2">
							<Input
								type="file"
								accept="image/*"
								onChange={async (
									event: React.ChangeEvent<HTMLInputElement>,
								) => {
									const file = event.target.files?.[0];
									if (!file) return;

									if (!file.type.startsWith("image/")) {
										setUploadError("Please upload an image file");
										return;
									}

									setIsUploading(true);
									setUploadError(null);

									try {
										const result = await onUploadWorkoutScreenshot(file);

										const successfulParsedWorkouts = result.workouts.filter(
											(r) => r.status === "fulfilled",
										);

										if (successfulParsedWorkouts.length > 0) {
											form.setValue(
												"workouts",
												successfulParsedWorkouts.map((r) => r.value),
											);
											setIsCreatingManually(true);
										} else {
											const firstError = result.workouts.find(
												(r) => r.status === "rejected",
											);
											if (firstError && firstError.status === "rejected") {
												setUploadError(
													`Failed to parse workout: ${firstError.reason?.message || "Unknown error"}`,
												);
											} else {
												setUploadError("No workouts found in the image");
											}
										}
									} catch (error) {
										console.error("Upload error:", error);
										setUploadError(
											error instanceof Error
												? error.message
												: "Failed to parse screenshot",
										);
									} finally {
										setIsUploading(false);
										event.target.value = "";
									}
								}}
								disabled={isUploading}
								className="flex-1"
							/>
							{isUploading && (
								<span className="text-sm text-muted-foreground">
									Parsing...
								</span>
							)}
						</div>
						{uploadError && (
							<p className="text-sm text-destructive">{uploadError}</p>
						)}
						<p className="text-sm text-muted-foreground">
							Upload a calendar screenshot to auto-fill workout details or{" "}
							<Button
								variant="link"
								type="button"
								className="p-0"
								onClick={() => setIsCreatingManually(true)}
							>
								create manually
							</Button>
							.
						</p>
					</div>
				)}
				{!!isCreatingManually && (
					<>
						{isAIEnabled && (
							<p className="text-sm text-muted-foreground">
								<Button
									variant="link"
									type="button"
									className="p-0 text-wrap max-w-full"
									onClick={() => setIsCreatingManually(false)}
								>
									Upload a calendar screenshot
								</Button>{" "}
								to auto-fill workout details or create manually.
							</p>
						)}
						{form.getValues("workouts").map((_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: it does not matter here
							<Fragment key={index}>
								{index > 0 && <hr className="my-4" />}
								<FormField
									control={form.control}
									name={`workouts.${index}.activityType`}
									render={({ field }) => (
										<FormItem>
											<FormLabel isRequired>Activity Type</FormLabel>
											<FormControl>
												<Tabs
													value={field.value ?? "erg"}
													onValueChange={(v) => {
														if (v === "erg" || v === "water") field.onChange(v);
													}}
												>
													<TabsList className="grid w-full grid-cols-2">
														<TabsTrigger value="water">Boat</TabsTrigger>
														<TabsTrigger value="erg">ERG</TabsTrigger>
													</TabsList>
												</Tabs>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name={`workouts.${index}.description`}
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												Description
												{parsingIndex === index && (
													<span className="text-xs font-normal text-muted-foreground">
														Parsing…
													</span>
												)}
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Workout Description"
													autoFocus
													{...field}
													onBlur={async (e) => {
														field.onBlur();
														const description = e.target.value;
														if (!description.trim()) return;
														setParseError(null);
														setParsingIndex(index);
														try {
															const ai = await onParseDescription(description);
															form.setValue(
																`workouts.${index}.workoutType`,
																ai.workoutType,
																{ shouldValidate: true },
															);
															if (ai.elapsedTime !== undefined) {
																form.setValue(
																	`workouts.${index}.elapsedTime`,
																	ai.elapsedTime,
																	{ shouldValidate: true },
																);
															}
															if (ai.distance !== undefined) {
																form.setValue(
																	`workouts.${index}.distance`,
																	ai.distance,
																	{ shouldValidate: true },
																);
															}
															form.setValue(
																`workouts.${index}.intervalCount`,
																ai.intervalCount ?? 1,
															);
															if (ai.fragments) {
																form.setValue(
																	`workouts.${index}.fragments`,
																	ai.fragments,
																);
															}
														} catch (err) {
															setParseError(
																`Failed to parse description: ${err instanceof Error ? err.message : String(err)}`,
															);
														} finally {
															setParsingIndex(null);
														}
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name={`workouts.${index}.intensityCategory`}
									render={({ field }) => (
										<FormItem>
											<FormLabel isRequired>Intensity</FormLabel>
											<FormControl>
												<ToggleGroup
													type="single"
													value={field.value}
													onValueChange={(value) => {
														if (value) field.onChange(value);
													}}
													className="w-full"
												>
													{INTENSITY_VALUES.map((c) => (
														<ToggleGroupItem
															key={c}
															value={c}
															aria-label={`Intensity ${c}`}
															className={cn(
																intensityColorMap[c],
																intensityActiveSelectorMap[c],
																"data-[state=on]:ring-2 data-[state=on]:ring-primary",
															)}
														>
															{c}
														</ToggleGroupItem>
													))}
												</ToggleGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name={`workouts.${index}.workoutType`}
									render={({ field }) => (
										<FormItem>
											<FormLabel isRequired>Workout Type</FormLabel>
											<FormControl>
												<ToggleGroup
													type="single"
													value={field.value ?? ""}
													onValueChange={(value) => {
														if (value) field.onChange(value);
													}}
													variant="outline"
													className="w-full"
												>
													{WORKOUT_TYPE_OPTIONS.map((opt) => (
														<ToggleGroupItem
															key={opt.value}
															value={opt.value}
															aria-label={opt.label}
															className="flex-1"
														>
															{opt.label}
														</ToggleGroupItem>
													))}
												</ToggleGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{form.watch(`workouts.${index}.workoutType`) === "distance" && (
									<FormField
										control={form.control}
										name={`workouts.${index}.distance`}
										render={({ field }) => (
											<FormItem>
												<FormLabel isRequired>Distance (m)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={0}
														step={1}
														placeholder="e.g. 5000"
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value === ""
																	? undefined
																	: Number(e.target.value),
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
								)}
								{form.watch(`workouts.${index}.workoutType`) === "time" && (
									<FormField
										control={form.control}
										name={`workouts.${index}.elapsedTime`}
										render={({ field }) => (
											<FormItem>
												<FormLabel isRequired>Elapsed Time (min)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={0}
														step={1}
														placeholder="e.g. 60"
														value={
															field.value === undefined
																? ""
																: Math.round(field.value / 60_000)
														}
														onChange={(e) =>
															field.onChange(
																e.target.value === ""
																	? undefined
																	: Number(e.target.value) * 60_000,
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
								)}
								<FormField
									control={form.control}
									name={`workouts.${index}.startDate`}
									render={({ field }) => {
										const dt = field.value
											? DateTime.fromISO(field.value)
											: null;
										const isValid = !!dt?.isValid;
										return (
											<FormItem>
												<FormControl>
													<FieldGroup className="flex-row">
														<Field>
															<FieldLabel
																htmlFor={`workouts.${index}.startDate.date`}
															>
																Date
																<span
																	aria-hidden
																	className="ml-0.5 text-destructive"
																>
																	*
																</span>
															</FieldLabel>
															<Popover
																open={openDateIndex === index}
																onOpenChange={(open) =>
																	setOpenDateIndex(open ? index : null)
																}
															>
																<PopoverTrigger asChild>
																	<Button
																		variant="outline"
																		id={`workouts.${index}.startDate.date`}
																		type="button"
																		className="w-32 justify-between font-normal"
																	>
																		{isValid
																			? dt.toLocaleString(DateTime.DATE_FULL)
																			: "Select date"}
																		<ChevronDownIcon />
																	</Button>
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
																			isValid ? dt.toJSDate() : undefined
																		}
																		defaultMonth={
																			isValid ? dt.toJSDate() : undefined
																		}
																		onSelect={(newDate) => {
																			if (!newDate) {
																				field.onChange(undefined);
																				setOpenDateIndex(null);
																				return;
																			}
																			const base = isValid
																				? dt
																				: DateTime.now().startOf("day");
																			field.onChange(
																				DateTime.fromJSDate(newDate)
																					.set({
																						hour: base.hour,
																						minute: base.minute,
																						second: base.second,
																					})
																					.toISO() ?? undefined,
																			);
																			setOpenDateIndex(null);
																		}}
																	/>
																</PopoverContent>
															</Popover>
														</Field>
														<Field className="w-32">
															<FieldLabel
																htmlFor={`workouts.${index}.startDate.time`}
															>
																Time
																<span
																	aria-hidden
																	className="ml-0.5 text-destructive"
																>
																	*
																</span>
															</FieldLabel>
															<Input
																type="time"
																id={`workouts.${index}.startDate.time`}
																step="1"
																value={isValid ? dt.toFormat("HH:mm:ss") : ""}
																onChange={(e) => {
																	if (!e.target.value) return;
																	const [h, m, s] = e.target.value
																		.split(":")
																		.map(Number);
																	const base = isValid
																		? dt
																		: DateTime.now().startOf("day");
																	field.onChange(
																		base
																			.set({
																				hour: h,
																				minute: m,
																				second: s ?? 0,
																			})
																			.toISO() ?? undefined,
																	);
																}}
																className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
															/>
														</Field>
													</FieldGroup>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</Fragment>
						))}
					</>
				)}
				{parseError && <p className="text-sm text-destructive">{parseError}</p>}
				<div className="flex justify-between gap-4 items-center">
					{typeof cancelLinkOrAction === "string" && (
						<Button variant="outline" asChild>
							<Link href={cancelLinkOrAction}>Cancel</Link>
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
					<div className="flex items-center gap-3 ml-auto">
						<Button type="submit" disabled={parsingIndex !== null}>
							Save
						</Button>
					</div>
				</div>
			</form>
		</Form>
	);
}
