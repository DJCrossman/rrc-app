import { ListPageSkeleton } from "@/components/list-page-skeleton";

export default function BoatsLoading() {
	return <ListPageSkeleton title="Boats" columns={6} rows={10} />;
}
