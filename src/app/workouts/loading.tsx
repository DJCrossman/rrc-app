import { ListPageSkeleton } from "@/components/list-page-skeleton";

export default function WorkoutsLoading() {
	return (
		<ListPageSkeleton
			title="Workouts"
			heading="Training Plan"
			columns={7}
			rows={6}
		/>
	);
}
