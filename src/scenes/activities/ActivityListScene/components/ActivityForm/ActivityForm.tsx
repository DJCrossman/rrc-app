"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, MaximizeIcon, XIcon } from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import type { Boats } from "@/app/api/v1/boats/actions";
import type { Ergs } from "@/app/api/v1/ergs/actions";
import type { Workouts } from "@/app/api/v1/workouts/actions";
import { Button } from "@/components/ui/button";
import { Form, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { type CreateActivity, createActivitySchema } from "@/schemas";

export type UploadErgActivityScreenshot = (
	params: {
		file: File;
	} & Pick<Extract<CreateActivity, { type: "erg" }>, "athleteId" | "ergId">,
) => Promise<{ success: boolean; data?: CreateActivity }>;

interface ActivityFormProps {
	boats: Boats;
	ergs: Ergs;
	workouts: Workouts;
	defaultValues?: Partial<CreateActivity>;
	onSubmit: SubmitHandler<CreateActivity>;
	onUploadErgActivityScreenshot?: UploadErgActivityScreenshot;
	onCancel?: (() => void) | string;
	isImageFullscreen: boolean;
	setIsImageFullscreen: (isFullscreen: boolean) => void;
}

export function ActivityForm({
	defaultValues,
	onSubmit,
	onUploadErgActivityScreenshot,
	onCancel: cancelLinkOrAction,
	isImageFullscreen,
	setIsImageFullscreen,
}: ActivityFormProps) {
	const isAIEnabled = !!onUploadErgActivityScreenshot;
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const currentMonth = DateTime.now().month;
	const form = useForm<CreateActivity>({
		resolver: zodResolver(createActivitySchema),
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
			distance: 0,
			athleteId: undefined,
			boatId: undefined,
			ergId: undefined,
			workoutId: undefined,
			...defaultValues,
		},
	});

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
				// Get current form values for IDs
				const currentAthleteId = form.getValues("athleteId");

				// Validate that required IDs are selected
				if (!currentAthleteId) {
					setUploadError("Please select an athlete first");
					return;
				}

				const result = await onUploadErgActivityScreenshot({
					file,
					athleteId: currentAthleteId,
				});

				if (result.success && result.data) {
					// Populate form with parsed data
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

	if (!isAIEnabled || form.watch("type") !== "erg") {
		return (
			<div className="p-4 rounded">
				<div className="mb-4 flex items-start gap-3">
					<div className="mt-1 rounded-lg bg-muted p-2">
						<AlertCircleIcon className="h-5 w-5 text-muted-foreground" />
					</div>
					<div>
						<h2 className="font-semibold text-foreground">
							Screenshot Parsing Unavailable
						</h2>
						<p className="text-sm text-muted-foreground mt-1">
							This feature is coming soon. Please manually enter your activity
							details below.
						</p>
						<p className="mt-3">
							<CancelButton onCancel={cancelLinkOrAction} />
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<fieldset className="space-y-2" disabled={isUploading || !isAIEnabled}>
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

									// Validate file type
									if (!file.type.startsWith("image/")) {
										setUploadError("Please upload an image file");
										return;
									}

									setUploadedFile(file);
									await handleUpload(file);
									// Clear the file input
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
						{/* Retry button */}
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
				<fieldset
					className="flex justify-between gap-4"
					disabled={isUploading || !isAIEnabled}
				>
					<CancelButton onCancel={cancelLinkOrAction} />
					<Button type="submit">Save</Button>
				</fieldset>
			</form>

			{/* Fullscreen Image Overlay */}
			{isImageFullscreen && uploadedFile && (
				<FullscreenImageOverlay
					file={uploadedFile}
					onClose={() => setIsImageFullscreen(false)}
				/>
			)}
		</Form>
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
