import { ListPageSkeleton } from "@/components/list-page-skeleton";

export default function GroupsLoading() {
	return <ListPageSkeleton title="Groups" columns={5} rows={5} />;
}
