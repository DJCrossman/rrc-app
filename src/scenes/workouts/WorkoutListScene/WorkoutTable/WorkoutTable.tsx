"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime, Interval } from "luxon";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Workout, Workouts } from "@/schemas/workouts.schema";

interface WorkoutTableProps {
	data: Workouts;
}

export function WorkoutTable({ data }: WorkoutTableProps) {
	const [currentWeek, setCurrentWeek] = useState(
		DateTime.now().startOf("week").minus({ days: 1 }),
	);

	const currentInterval = Interval.fromDateTimes(
		currentWeek,
		currentWeek.plus({ weeks: 1 }),
	);

	const workoutsByDay = currentInterval
		.splitBy({ days: 1 })
		.map((dayInterval) => {
			const dayStart = dayInterval.start;
			const dayEnd = dayInterval.end;

			const morningWorkouts = data
				.filter(
					(workout) =>
						dayStart &&
						DateTime.fromISO(workout.startDate) >= dayStart &&
						DateTime.fromISO(workout.startDate) < dayStart.plus({ hours: 12 }),
				)
				.map((workout) => ({
					...workout,
					timeFrame: workout.duration
						? Interval.fromDateTimes(
								DateTime.fromISO(workout.startDate),
								DateTime.fromISO(workout.startDate).plus({
									milliseconds: workout.duration,
								}),
							).toLocaleString(DateTime.TIME_SIMPLE)
						: "N/A",
				}));

			const eveningWorkouts = data
				.filter(
					(workout) =>
						dayStart &&
						dayEnd &&
						DateTime.fromISO(workout.startDate) >=
							dayStart.plus({ hours: 12 }) &&
						DateTime.fromISO(workout.startDate) < dayEnd,
				)
				.map((workout) => ({
					...workout,
					timeFrame: workout.duration
						? Interval.fromDateTimes(
								DateTime.fromISO(workout.startDate),
								DateTime.fromISO(workout.startDate).plus({
									milliseconds: workout.duration,
								}),
							).toLocaleString(DateTime.TIME_SIMPLE)
						: "N/A",
				}));

			return {
				day: dayStart,
				morningWorkouts,
				eveningWorkouts,
			};
		});

	return (
		<div className="w-full flex-col justify-start gap-6">
			<div className="flex justify-between items-center py-6 px-4 xl:px-6">
				<button
					type="button"
					onClick={() => {
						setCurrentWeek((prev) => prev.minus({ weeks: 1 }));
					}}
				>
					<ChevronLeft className="inline align-text-bottom" size={16} />
					Previous <span className="hidden sm:inline">Week</span>
				</button>
				<h2>{currentInterval.toLocaleString(DateTime.DATE_MED)}</h2>
				<button
					type="button"
					onClick={() => {
						setCurrentWeek((prev) => prev.plus({ weeks: 1 }));
					}}
				>
					Next <span className="hidden sm:inline">Week</span>
					<ChevronRight className="inline align-text-bottom" size={16} />
				</button>
			</div>
			<div className="flex flex-col xl:flex-row gap-4 overflow-auto px-4 xl:px-6">
				{workoutsByDay.map(({ day, morningWorkouts, eveningWorkouts }) => (
					<div key={day?.toISO()} className="xl:w-1/7 mb-6">
						<h3 className="text-lg font-bold text-center">
							<span className="block uppercase">
								{day?.toLocaleString({ weekday: "short" })}
							</span>
							<span className="block text-lg">
								{day?.toLocaleString({ day: "numeric" })}
							</span>
						</h3>
						<div className="mt-4 xl:min-h-[200px]">
							<h4 className="font-semibold mb-2">Morning</h4>
							{!!morningWorkouts.length &&
								morningWorkouts.map((workout) => (
									<WorkoutItem key={workout.id} workout={workout} />
								))}
							{!morningWorkouts.length && (
								<p className="text-gray-500">No morning workouts.</p>
							)}
						</div>
						<div className="mt-4 xl:min-h-[200px]">
							<h4 className="font-semibold mb-2">Evening</h4>
							{!!eveningWorkouts.length &&
								eveningWorkouts.map((workout) => (
									<WorkoutItem key={workout.id} workout={workout} />
								))}
							{!eveningWorkouts.length && (
								<p className="text-gray-500">No evening workouts.</p>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

const WorkoutItem = ({
	workout,
}: {
	workout: Workout & { timeFrame: string };
}) => {
	return (
		<Card className="my-2 p-0">
			<a href={routes.workouts.view(workout.id)} className="h-full w-full p-2">
				{workout.description.split(";").map((line, index) => (
					<span
						key={line}
						className={cn("block", index > 0 ? "text-sm" : "font-semibold")}
					>
						{line.trim()}
					</span>
				))}
				<span className="block mt-2 text-sm">
					<i>{workout.timeFrame}</i>
				</span>
			</a>
		</Card>
	);
};
