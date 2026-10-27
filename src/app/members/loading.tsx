import { ListPageSkeleton } from "@/components/list-page-skeleton";

export default function MembersLoading() {
	return <ListPageSkeleton title="Members" columns={7} rows={10} />;
}
