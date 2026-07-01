import { ListPageSkeleton } from "@/components/list-page-skeleton";

export default function ActivitiesLoading() {
	return <ListPageSkeleton title="Activities" columns={5} rows={10} />;
}
