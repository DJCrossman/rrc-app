import { createWorkout } from '@/app/api/v1/workouts/actions';
import { routes } from '@/lib/routes';
import { WorkoutCreateScene } from '@/scenes/workouts';
import { CreateWorkout } from '@/schemas';
import { RedirectType, redirect } from 'next/navigation';

export default function CreateWorkoutPage() {
  const handleSubmit = async (workout: CreateWorkout) => {
    'use server';
    await createWorkout(workout);
    redirect(routes.workouts.list(), RedirectType.push);
  };

  return <WorkoutCreateScene onSubmit={handleSubmit} />;
}