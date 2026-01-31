"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Fragment, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import type { UploadWorkoutScreenshotResult } from "@/app/api/v1/workouts/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { type CreateWorkout, workoutCoreSchema } from "@/schemas";

interface WorkoutFormData {
	workouts: Array<
		Omit<CreateWorkout, "intervalCount"> & { intervalCount?: number }
	>;
}

interface WorkoutFormProps {
	defaultValues?: { workouts: Partial<CreateWorkout>[] };
	onSubmit: SubmitHandler<{ workouts: CreateWorkout[] }>;
	onUploadWorkoutScreenshot?: (
		file: File,
	) => Promise<UploadWorkoutScreenshotResult>;
	onCancel?: (() => void) | string;
}

export function WorkoutForm({
	onSubmit,
	onUploadWorkoutScreenshot,
	onCancel: cancelLinkOrAction,
	defaultValues,
}: WorkoutFormProps) {
	const isAIEnabled = !!onUploadWorkoutScreenshot;
	const [isCreatingManually, setIsCreatingManually] = useState(!isAIEnabled);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const form = useForm<WorkoutFormData>({
		resolver: zodResolver(z.object({ workouts: z.array(workoutCoreSchema) })),
		defaultValues: defaultValues || {
			workouts: [{ description: "", startDate: undefined, intervalCount: 1 }],
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((data) =>
					onSubmit({ workouts: data.workouts as CreateWorkout[] }),
				)}
				className="space-y-8"
			>
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

									// Validate file type
									if (!file.type.startsWith("image/")) {
										setUploadError("Please upload an image file");
										return;
									}

									setIsUploading(true);
									setUploadError(null);

									try {
										const result = await onUploadWorkoutScreenshot(file);

										// Get the first successfully parsed workout
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
											// Check for errors
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
									name={`workouts.${index}.description`}
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
									name={`workouts.${index}.startDate`}
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
							</Fragment>
						))}
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
