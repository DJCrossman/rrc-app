import { WorkoutListScene } from '@/scenes/workouts';
import { getWorkouts } from '@/app/api/v1/workouts/actions';

export default async function WorkoutsPage() {
  const { data } = await getWorkouts();
  return <WorkoutListScene data={data} />;
}