"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
	type EventFormInput,
	type IntensityCategory,
	type WorkoutActivityType,
	WorkoutActivityTypes,
} from "@/schemas";
import {
	intensityActiveSelectorMap,
	intensityColorMap,
} from "../../utils/intensityColorMap";
import { parseWorkoutDescription } from "../../utils/parseWorkoutDescription";

const INTENSITY_VALUES: IntensityCategory[] = [
	"C1",
	"C2",
	"C3",
	"C4",
	"C5",
	"C6",
];

interface WorkoutFieldsProps {
	isParsing: boolean;
	onParsingChange: (isParsing: boolean) => void;
}

export const WorkoutFields = ({
	isParsing,
	onParsingChange,
}: WorkoutFieldsProps) => {
	const [parseError, setParseError] = useState<string | null>(null);
	const { control, watch, setValue } = useFormContext<EventFormInput>();
	const workoutType = watch("workout.workoutType");

	return (
		<>
			<FormField
				control={control}
				name="workout.activityType"
				render={({ field }) => (
					<FormItem>
						<FormLabel isRequired>Activity type</FormLabel>
						<FormControl>
							<Tabs
								value={field.value}
								onValueChange={(value) => {
									if (
										WorkoutActivityTypes.includes(value as WorkoutActivityType)
									)
										field.onChange(value);
								}}
							>
								<TabsList className="grid w-full grid-cols-4">
									<TabsTrigger value="water">Boat</TabsTrigger>
									<TabsTrigger value="erg">ERG</TabsTrigger>
									<TabsTrigger value="crossTrain">XT</TabsTrigger>
									<TabsTrigger value="strength">S&C</TabsTrigger>
								</TabsList>
							</Tabs>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="workout.description"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="flex items-center gap-2">
							Workout
							{isParsing && (
								<span className="text-xs font-normal text-muted-foreground">
									Parsing…
								</span>
							)}
						</FormLabel>
						<FormControl>
							<Textarea
								placeholder="3 × 20′ / 3′ rest @ R20"
								{...field}
								onBlur={async (event) => {
									field.onBlur();
									const description = event.target.value.trim();
									if (!description) return;
									setParseError(null);
									onParsingChange(true);
									try {
										const parsed = await parseWorkoutDescription(description);
										setValue("workout.workoutType", parsed.workoutType, {
											shouldValidate: true,
										});
										setValue("workout.elapsedTime", parsed.elapsedTime ?? null);
										setValue("workout.distance", parsed.distance ?? null);
										setValue(
											"workout.intervalCount",
											parsed.intervalCount ?? 1,
										);
										setValue("workout.fragments", parsed.fragments ?? []);
									} catch (error) {
										setParseError(
											`Failed to parse description: ${error instanceof Error ? error.message : String(error)}`,
										);
									} finally {
										onParsingChange(false);
									}
								}}
							/>
						</FormControl>
						<FormMessage />
						{parseError && (
							<p className="text-sm text-destructive">{parseError}</p>
						)}
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="workout.intensityCategory"
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
								{INTENSITY_VALUES.map((category) => (
									<ToggleGroupItem
										key={category}
										value={category}
										aria-label={`Intensity ${category}`}
										className={cn(
											intensityColorMap[category],
											intensityActiveSelectorMap[category],
											"data-[state=on]:ring-2 data-[state=on]:ring-primary",
										)}
									>
										{category}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="workout.workoutType"
				render={({ field }) => (
					<FormItem>
						<FormLabel isRequired>Workout type</FormLabel>
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
								<ToggleGroupItem value="time">Time</ToggleGroupItem>
								<ToggleGroupItem value="distance">Distance</ToggleGroupItem>
								<ToggleGroupItem value="other">Other</ToggleGroupItem>
							</ToggleGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="workout.distance"
				render={({ field }) => (
					<FormItem hidden={workoutType !== "distance"}>
						<FormLabel isRequired>Distance (m)</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={0}
								step={1}
								placeholder="e.g. 5000"
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
				name="workout.elapsedTime"
				render={({ field }) => (
					<FormItem hidden={workoutType !== "time"}>
						<FormLabel isRequired>Elapsed time (min)</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={0}
								step={1}
								placeholder="e.g. 60"
								value={
									field.value === null ? "" : Math.round(field.value / 60_000)
								}
								onChange={(event) =>
									field.onChange(
										event.target.value === ""
											? null
											: Number(event.target.value) * 60_000,
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
		</>
	);
};
