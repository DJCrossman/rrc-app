"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MaximizeIcon, XIcon } from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	type SubmitHandler,
	type UseFormReturn,
	useForm,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combo-box";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDuration, formatMeters } from "@/lib/formatters";
import type { Boats, Ergs, Workouts } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { getWorkoutBreakdown } from "@/scenes/workouts/WorkoutListScene/utils/getWorkoutBreakdown";
import {
	COURSE_LAP_METERS,
	type CreateActivity,
	type CreateActivityFormInput,
	createActivityFormSchema,
} from "@/schemas";

const toCreateActivity = (input: CreateActivityFormInput): CreateActivity =>
	createActivityFormSchema.parse(input);

export type UploadErgActivityScreenshot = (
	params: {
		file: File;
	} & Pick<Extract<CreateActivity, { type: "erg" }>, "athleteId" | "ergId">,
) => Promise<{ success: boolean; data?: CreateActivity }>;

interface ActivityFormProps {
	boats: Boats;
	ergs: Ergs;
	workouts: Workouts;
	defaultValues?: Partial<CreateActivityFormInput>;
	onSubmit: (data: CreateActivity) => void | Promise<void>;
	onUploadErgActivityScreenshot: UploadErgActivityScreenshot;
	onCancel?: (() => void) | string;
	isImageFullscreen: boolean;
	setIsImageFullscreen: (isFullscreen: boolean) => void;
}

export function ActivityForm({
	boats,
	workouts,
	defaultValues,
	onSubmit,
	onUploadErgActivityScreenshot,
	onCancel: cancelLinkOrAction,
	isImageFullscreen,
	setIsImageFullscreen,
}: ActivityFormProps) {
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const currentMonth = DateTime.now().month;
	const form = useForm<CreateActivityFormInput>({
		resolver: zodResolver(createActivityFormSchema, undefined, { raw: true }),
		defaultValues: {
			type:
				currentMonth >= 5 && currentMonth <= 9
					? ("water" as const)
					: ("erg" as const),
			name: "",
			startDate: DateTime.now().toISO(),
			timezone: DateTime.now().zoneName,
			workoutType: "distance",
			elapsedTime: 0,
			athleteId: undefined,
			boatId: undefined,
			ergId: undefined,
			workoutId: undefined,
			courseType: "course",
			...defaultValues,
		},
	});

	const type = form.watch("type");
	const laps = form.watch("laps");
	const courseType = form.watch("courseType");

	const visibleWorkouts = useMemo(() => {
		const startOfToday = DateTime.now().startOf("day");
		return workouts.filter(
			(w) =>
				w.activityType === type &&
				DateTime.fromISO(w.startDate) >= startOfToday,
		);
	}, [workouts, type]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isImageFullscreen) {
				setIsImageFullscreen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isImageFullscreen, setIsImageFullscreen]);

	const handleUpload = useCallback(
		async (file: File) => {
			if (!onUploadErgActivityScreenshot) return;
			setIsUploading(true);
			setUploadError(null);
			try {
				const currentAthleteId = form.getValues("athleteId");

				if (!currentAthleteId) {
					setUploadError("Please select an athlete first");
					return;
				}

				const result = await onUploadErgActivityScreenshot({
					file,
					athleteId: currentAthleteId,
				});

				if (result.success && result.data) {
					form.reset(result.data);
				} else {
					setUploadError("Failed to parse screenshot");
				}
			} catch (error) {
				console.error("Upload error:", error);
				setUploadError(
					error instanceof Error ? error.message : "Failed to parse screenshot",
				);
			} finally {
				setIsUploading(false);
			}
		},
		[onUploadErgActivityScreenshot, form],
	);

	const handleTypeChange = (newType: string) => {
		if (newType !== "erg" && newType !== "water") return;
		form.setValue("type", newType);
		form.clearErrors();
		if (newType !== "erg") {
			setUploadedFile(null);
			setUploadError(null);
		}
	};

	const handleSubmit: SubmitHandler<CreateActivityFormInput> = (values) => {
		if (values.type === "water" && !values.workoutId) {
			form.setError("workoutId", { message: "Please select a workout" });
			return;
		}
		return onSubmit(toCreateActivity(values));
	};

	const previewDistance =
		type === "water" && laps && courseType
			? laps * COURSE_LAP_METERS[courseType]
			: 0;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
				<Tabs value={type} onValueChange={handleTypeChange}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="water">Boat</TabsTrigger>
						<TabsTrigger value="erg">ERG</TabsTrigger>
					</TabsList>

					<TabsContent value="water" className="space-y-8 pt-4">
						<WorkoutCombobox form={form} workouts={visibleWorkouts} />

						<FormField
							control={form.control}
							name="boatId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Boat</FormLabel>
									<FormControl>
										<Combobox
											value={field.value ?? ""}
											values={boats.map((boat) => ({
												value: boat.id,
												label: boat.name,
											}))}
											searchPlaceholder="Search boats..."
											selectPlaceholder="Select boat..."
											emptyText="No boats found."
											onValueChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="laps"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Laps</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0.5}
											step={0.5}
											value={field.value ?? ""}
											onChange={(e) => {
												const v = e.target.value;
												field.onChange(v === "" ? undefined : Number(v));
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="courseType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Course</FormLabel>
									<FormControl>
										<Tabs
											value={field.value ?? "course"}
											onValueChange={(v) => {
												if (v === "course" || v === "into_the_bay")
													field.onChange(v);
											}}
										>
											<TabsList className="grid w-full grid-cols-2">
												<TabsTrigger value="course">Course</TabsTrigger>
												<TabsTrigger value="into_the_bay">
													Into the bay
												</TabsTrigger>
											</TabsList>
										</Tabs>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-1">
							<FormLabel>Distance</FormLabel>
							<div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
								{previewDistance > 0 ? formatMeters(previewDistance) : "—"}
							</div>
						</div>
					</TabsContent>

					<TabsContent value="erg" className="space-y-8 pt-4">
						<WorkoutCombobox form={form} workouts={visibleWorkouts} />

						<fieldset className="space-y-2" disabled={isUploading}>
							<FormLabel>Upload ERG Screenshot</FormLabel>
							{!uploadedFile && (
								<div className="flex items-center gap-2">
									<Input
										type="file"
										accept="image/*"
										onChange={async (
											event: React.ChangeEvent<HTMLInputElement>,
										) => {
											if (!onUploadErgActivityScreenshot) return;
											const file = event.target.files?.[0];
											if (!file) return;

											if (!file.type.startsWith("image/")) {
												setUploadError("Please upload an image file");
												return;
											}

											setUploadedFile(file);
											await handleUpload(file);
											event.target.value = "";
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
							)}
							{uploadError && (
								<p className="text-sm text-destructive">{uploadError}</p>
							)}
							<p className="text-sm text-muted-foreground">
								Upload an ERG screenshot to auto-fill activity details.{" "}
								{uploadedFile && !isUploading && (
									<>
										<Button
											variant="link"
											size="sm"
											onClick={() => handleUpload(uploadedFile)}
										>
											Parse Again
										</Button>
										<Button
											variant="link"
											size="sm"
											onClick={() => {
												setUploadedFile(null);
												setUploadError(null);
											}}
										>
											Remove Image
										</Button>
									</>
								)}
							</p>
						</fieldset>
						{!!uploadedFile && (
							<fieldset disabled={isUploading} className="space-y-4">
								<div className="space-y-2">
									<FormLabel>
										Uploaded Image
										{isUploading && (
											<span className="text-sm text-muted-foreground">
												Parsing...
											</span>
										)}
									</FormLabel>
									<div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border group">
										<Image
											src={URL.createObjectURL(uploadedFile)}
											alt="ERG activity screenshot"
											fill
											unoptimized
											className="object-contain"
										/>
										<Button
											type="button"
											variant="secondary"
											size="icon"
											className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={() => setIsImageFullscreen(true)}
										>
											<MaximizeIcon className="h-4 w-4" />
										</Button>
									</div>
								</div>

								<div className="space-y-2">
									<FormLabel>Parsed Data</FormLabel>
									<div
										className={cn(
											"rounded-lg border p-4 space-y-2 bg-muted/50",
											isUploading && "opacity-55",
										)}
									>
										<div className="grid grid-cols-2 gap-2 text-sm">
											<div className="font-medium">Description:</div>
											<div>{form.watch("name") || "—"}</div>

											<div className="font-medium">Distance:</div>
											<div>
												{form.watch("distance")
													? `${form.watch("distance")}m`
													: "—"}
											</div>

											<div className="font-medium">Elapsed Time:</div>
											<div>
												{form.watch("elapsedTime")
													? formatDuration(form.watch("elapsedTime"))
													: "—"}
											</div>
											<div className="font-medium">Start Date:</div>
											<div>
												{form.watch("startDate")
													? DateTime.fromISO(
															form.watch("startDate"),
														).toLocaleString(DateTime.DATE_MED)
													: "—"}
											</div>
										</div>
									</div>
								</div>
							</fieldset>
						)}
					</TabsContent>
				</Tabs>

				<fieldset className="flex justify-between gap-4" disabled={isUploading}>
					<CancelButton onCancel={cancelLinkOrAction} />
					<Button type="submit">Save</Button>
				</fieldset>
			</form>

			{isImageFullscreen && uploadedFile && (
				<FullscreenImageOverlay
					file={uploadedFile}
					onClose={() => setIsImageFullscreen(false)}
				/>
			)}
		</Form>
	);
}

interface WorkoutComboboxProps {
	form: UseFormReturn<CreateActivityFormInput>;
	workouts: Workouts;
}

function WorkoutCombobox({ form, workouts }: WorkoutComboboxProps) {
	return (
		<FormField
			control={form.control}
			name="workoutId"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Workout</FormLabel>
					<FormControl>
						<Combobox
							value={field.value ?? ""}
							values={workouts.map((workout) => ({
								value: workout.id,
								label: `${getWorkoutBreakdown(workout).title} — ${DateTime.fromISO(
									workout.startDate,
								).toLocaleString(DateTime.DATE_MED)}`,
							}))}
							searchPlaceholder="Search workouts..."
							selectPlaceholder="Select workout..."
							emptyText="No workouts found."
							onValueChange={(value) => {
								field.onChange(value);
								const workout = workouts.find((w) => w.id === value);
								if (!workout) return;
								form.setValue("name", getWorkoutBreakdown(workout).title);
								form.setValue("startDate", workout.startDate);
								form.setValue("workoutType", workout.workoutType);
								form.setValue("elapsedTime", workout.elapsedTime ?? 0);
								if (form.getValues("type") === "erg") {
									form.setValue("distance", workout.distance ?? 0);
								}
							}}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

const CancelButton = ({
	onCancel: cancelLinkOrAction,
}: Pick<ActivityFormProps, "onCancel">) => {
	if (!cancelLinkOrAction) return null;

	if (typeof cancelLinkOrAction === "string") {
		return (
			<Button variant="outline" asChild>
				<Link href={cancelLinkOrAction}>Cancel</Link>
			</Button>
		);
	}

	return (
		<Button
			variant="outline"
			type="button"
			onClick={() => {
				cancelLinkOrAction();
			}}
		>
			Cancel
		</Button>
	);
};

const FullscreenImageOverlay = ({
	file,
	onClose,
}: {
	file: File;
	onClose: () => void;
}) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				onClose();
			}
		};

		window.addEventListener("mousedown", handleClickOutside);
		return () => {
			window.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClose]);

	if (typeof document === "undefined") return null;

	return createPortal(
		<div
			ref={ref}
			className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
		>
			<div className="relative w-full h-full">
				<Image
					src={URL.createObjectURL(file)}
					alt="ERG activity screenshot (fullscreen)"
					fill
					unoptimized
					className="object-contain"
				/>
			</div>
			<div className="absolute top-4 right-4">
				<Button
					type="button"
					variant="secondary"
					size="icon"
					onClick={onClose}
					aria-label="Close fullscreen"
				>
					<XIcon className="h-4 w-4" />
				</Button>
			</div>
		</div>,
		document.body,
	);
};
