import { getWorkouts } from "@/app/api/v1/workouts/actions";
import { WorkoutListScene } from "@/scenes/workouts";

export default async function WorkoutsPage() {
	const { data } = await getWorkouts();
	return <WorkoutListScene data={data} />;
}
