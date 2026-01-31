"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DateTime } from "luxon";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combo-box";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	type Athletes,
	type Boats,
	type CreateActivity,
	createActivitySchema,
	type Ergs,
	type Workouts,
} from "@/schemas";

interface ActivityFormProps {
	athletes: Athletes;
	boats: Boats;
	ergs: Ergs;
	workouts: Workouts;
	defaultValues?: Partial<CreateActivity>;
	onSubmit: SubmitHandler<CreateActivity>;
	onUploadActivityScreenshot?: (
		file: File,
	) => Promise<{ success: boolean; data?: CreateActivity }>;
	onCancel?: (() => void) | string;
}

export function ActivityForm({
	athletes,
	boats,
	ergs,
	workouts,
	defaultValues,
	onSubmit,
	onUploadActivityScreenshot,
	onCancel: cancelLinkOrAction,
}: ActivityFormProps) {
	const isAIEnabled = !!onUploadActivityScreenshot;
	const [isCreatingManually, setIsCreatingManually] = useState(!isAIEnabled);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	// Determine default activity type based on current month
	const defaultActivityType = useMemo(() => {
		const currentMonth = DateTime.now().month;
		// May (5) to September (9) is water season
		return currentMonth >= 5 && currentMonth <= 9 ? "water" : "erg";
	}, []);

	const form = useForm<CreateActivity>({
		resolver: zodResolver(createActivitySchema),
		defaultValues: defaultValues || {
			type: defaultActivityType as "water" | "erg",
			name: "",
			startDate: DateTime.now().toISO(),
			timezone: DateTime.now().zoneName,
			workoutType: "distance",
			elapsedTime: 0,
			distance: 0,
			athleteId: undefined,
			boatId: undefined,
			ergId: undefined,
			workoutId: null,
		},
	});

	const activityType = form.watch("type");
	const selectedWorkoutId = form.watch("workoutId");
	const workoutType = form.watch("workoutType");

	// Filter workouts to only show upcoming ones (from start of today)
	const upcomingWorkouts = useMemo(() => {
		const startOfToday = DateTime.now().startOf("day");
		return workouts.filter((workout) => {
			const workoutDate = DateTime.fromISO(workout.startDate);
			return workoutDate >= startOfToday;
		});
	}, [workouts]);

	// Get selected workout details
	const selectedWorkout = useMemo(() => {
		if (!selectedWorkoutId) return null;
		return workouts.find((w) => w.id === selectedWorkoutId);
	}, [selectedWorkoutId, workouts]);

	const intervalCount = selectedWorkout?.intervalCount || 1;
	const [intervalTimeValues, setIntervalTimeValues] = useState<string[]>(
		Array(intervalCount).fill(""),
	);
	const [intervalDistanceValues, setIntervalDistanceValues] = useState<
		number[]
	>(Array(intervalCount).fill(0));

	// Convert h:mm:ss to milliseconds
	const timeToMs = useCallback((timeStr: string): number => {
		const parts = timeStr.split(":");
		if (parts.length === 3) {
			const hours = parseInt(parts[0], 10) || 0;
			const minutes = parseInt(parts[1], 10) || 0;
			const seconds = parseInt(parts[2], 10) || 0;
			return (hours * 3600 + minutes * 60 + seconds) * 1000;
		}
		return 0;
	}, []);

	// Convert milliseconds to h:mm:ss
	const msToTime = (ms: number): string => {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	};

	// Calculate sum of intervals
	const intervalSum = useMemo(() => {
		if (workoutType === "distance") {
			// Sum durations (convert to ms first)
			return intervalTimeValues.reduce((sum, val) => {
				return sum + timeToMs(val);
			}, 0);
		}
		// Sum distances
		return intervalDistanceValues.reduce((sum, val) => sum + val, 0);
	}, [intervalTimeValues, intervalDistanceValues, workoutType, timeToMs]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				{!isCreatingManually && onUploadActivityScreenshot && (
					<div className="space-y-2">
						<FormLabel>Upload ERG Screenshot</FormLabel>
						<div className="flex items-center gap-2">
							<Input
								type="file"
								accept="image/*"
								onChange={async (
									event: React.ChangeEvent<HTMLInputElement>,
								) => {
									const file = event.target.files?.[0];
									if (!file) return;

									// Validate file type
									if (!file.type.startsWith("image/")) {
										setUploadError("Please upload an image file");
										return;
									}

									setIsUploading(true);
									setUploadError(null);

									try {
										const result = await onUploadActivityScreenshot(file);

										if (result.success && result.data) {
											// Populate form with parsed data
											form.reset(result.data);
											setIsCreatingManually(true);
										} else {
											setUploadError("Failed to parse screenshot");
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
										// Clear the file input
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
							Upload an ERG screenshot to auto-fill activity details or{" "}
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
									Upload an ERG screenshot
								</Button>{" "}
								to auto-fill activity details or create manually.
							</p>
						)}

						{/* Activity Type Selection */}
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Activity Type</FormLabel>
									<FormControl>
										<ToggleGroup
											type="single"
											value={field.value}
											onValueChange={(value) => {
												if (value) {
													field.onChange(value);
													// Reset boat/erg selection when switching type
													if (workoutType === "distance") {
														form.setValue("elapsedTime", intervalSum);
													} else {
														form.setValue("distance", intervalSum);
													}
												}
											}}
										>
											<ToggleGroupItem value="water">Water</ToggleGroupItem>
											<ToggleGroupItem value="erg">ERG</ToggleGroupItem>
										</ToggleGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Workout Selection */}
						<FormField
							control={form.control}
							name="workoutId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Workout (Optional)</FormLabel>
									<FormControl>
										<Combobox
											value={field.value?.toString() || ""}
											values={[
												{ value: "", label: "No workout" },
												...upcomingWorkouts.map((workout) => ({
													value: workout.id.toString(),
													label: `${DateTime.fromISO(workout.startDate).toLocaleString(DateTime.DATE_MED)} - ${workout.description}`,
												})),
											]}
											onValueChange={(value) => {
												if (!value) {
													// Clear workout selection
													field.onChange(null);
													return;
												}

												const workoutId = Number(value);
												const workout = upcomingWorkouts.find(
													(w) => w.id === workoutId,
												);

												if (!workout) return;

												field.onChange(workoutId);
												form.setValue("name", workout.description);
												form.setValue("workoutType", workout.workoutType);
												form.setValue("startDate", workout.startDate);

												if (
													workout.workoutType === "distance" &&
													workout.distance
												) {
													form.setValue("distance", workout.distance);
												}
												if (
													workout.workoutType === "time" &&
													workout.elaspedTime
												) {
													form.setValue("elapsedTime", workout.elaspedTime);
												}
											}}
											searchPlaceholder="Search workouts..."
											selectPlaceholder="Select a workout"
											emptyText="No upcoming workouts found."
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Athlete Selection */}
						<FormField
							control={form.control}
							name="athleteId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Athlete</FormLabel>
									<FormControl>
										<Select
											onValueChange={(value) =>
												field.onChange(parseInt(value, 10))
											}
											value={field.value?.toString()}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select Athlete" />
											</SelectTrigger>
											<SelectContent>
												{athletes.map((athlete) => (
													<SelectItem
														key={athlete.id}
														value={athlete.id.toString()}
													>
														{athlete.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Boat Selection (Water only) */}
						{activityType === "water" && (
							<FormField
								control={form.control}
								name="boatId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Boat</FormLabel>
										<FormControl>
											<Select
												onValueChange={(value) =>
													field.onChange(parseInt(value, 10))
												}
												value={field.value?.toString()}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select Boat" />
												</SelectTrigger>
												<SelectContent>
													{boats.map((boat) => (
														<SelectItem
															key={boat.id}
															value={boat.id.toString()}
														>
															{boat.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						{/* ERG Selection (ERG only) */}
						{activityType === "erg" && (
							<FormField
								control={form.control}
								name="ergId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>ERG</FormLabel>
										<FormControl>
											<Select
												onValueChange={(value) =>
													field.onChange(parseInt(value, 10))
												}
												value={field.value?.toString()}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select ERG" />
												</SelectTrigger>
												<SelectContent>
													{ergs.map((erg) => (
														<SelectItem key={erg.id} value={erg.id.toString()}>
															{erg.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* Start Date/Time */}
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

						{/* Interval Inputs */}
						{selectedWorkout && (
							<div className="space-y-4">
								<FormLabel>
									{workoutType === "distance"
										? "Time per Interval"
										: "Distance per Interval"}
								</FormLabel>

								{/* Show sum */}
								<div className="p-3 bg-muted rounded-md">
									<p className="text-sm font-medium">
										Total:{" "}
										{workoutType === "distance"
											? msToTime(intervalSum)
											: `${intervalSum.toLocaleString()}m`}
									</p>
								</div>

								{/* Interval inputs */}
								{Array.from({ length: intervalCount }).map((_, index) => (
									<div key={`interval-${selectedWorkout?.id || 0}-${index}`}>
										<FormLabel>Interval {index + 1}</FormLabel>
										{workoutType === "distance" ? (
											<Input
												type="text"
												placeholder="h:mm:ss"
												value={intervalTimeValues[index] || ""}
												onChange={(e) => {
													const newValues = [...intervalTimeValues];
													newValues[index] = e.target.value;
													setIntervalTimeValues(newValues);
												}}
											/>
										) : (
											<Input
												type="number"
												placeholder="Distance in meters"
												value={intervalDistanceValues[index] || ""}
												onChange={(e) => {
													const newValues = [...intervalDistanceValues];
													newValues[index] = parseFloat(e.target.value) || 0;
													setIntervalDistanceValues(newValues);
												}}
											/>
										)}
									</div>
								))}
							</div>
						)}

						{/* Manual distance/time input when no workout selected */}
						{!selectedWorkout && (
							<>
								<FormField
									control={form.control}
									name="distance"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Distance (meters)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="5000"
													{...field}
													onChange={(e) =>
														field.onChange(parseFloat(e.target.value) || 0)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="elapsedTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Time (h:mm:ss)</FormLabel>
											<FormControl>
												<Input
													type="text"
													placeholder="0:20:00"
													value={msToTime(field.value)}
													onChange={(e) => {
														const ms = timeToMs(e.target.value);
														field.onChange(ms);
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						)}
					</>
				)}
				<div className="flex justify-between gap-4">
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
					<Button type="submit">Save</Button>
				</div>
			</form>
		</Form>
	);
}
