import { ListPageSkeleton } from "@/components/list-page-skeleton";

export default function AthletesLoading() {
	return <ListPageSkeleton title="Athletes" columns={4} rows={10} />;
}
