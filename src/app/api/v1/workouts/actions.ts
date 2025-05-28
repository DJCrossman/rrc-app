'use server';
import { Workout, CreateWorkout, workoutSchema, workoutsSchema } from '@/schemas';
import workouts from './workouts.json';

const workoutsParsed = workoutsSchema.parse(workouts);

export const getWorkouts = async () => {
  return {
    data: workoutsParsed,
  };
};

export async function getWorkoutById(id: number): Promise<Workout | null> {
  const workout = workoutsParsed.find((workout) => workout.id === id);
  return workout ?? null;
}

export const createWorkout = async (data: CreateWorkout): Promise<Workout> => {
  const workout = workoutSchema.parse({
    id: workoutsParsed.length + 1,
    ...data,
  });
  workoutsParsed.push(workout);
  return workout;
};

export const updateWorkout = async (data: Workout): Promise<Workout> => {
  const workoutIndex = workoutsParsed.findIndex((workout) => workout.id === data.id);
  if (workoutIndex === -1) {
    throw new Error('Workout not found');
  }
  const updatedWorkout = workoutSchema.parse({
    ...workoutsParsed[workoutIndex],
    ...data,
  });
  workoutsParsed[workoutIndex] = updatedWorkout;
  return updatedWorkout;
};