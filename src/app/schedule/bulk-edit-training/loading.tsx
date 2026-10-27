import { ListPageSkeleton } from "@/components/list-page-skeleton";

export default function TrainingBulkEditLoading() {
	return (
		<ListPageSkeleton
			title="Schedule"
			heading="Bulk edit training"
			columns={9}
			rows={10}
			defaultSidebarOpen={false}
		/>
	);
}
