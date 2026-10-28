"use client";

import { IconPlus, IconRefresh } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Group, Groups, Programs } from "@/lib/trpc/types";
import {
	GroupCreateDrawer,
	GroupDetailsDrawer,
	GroupTable,
} from "./components";

interface IProps {
	groups: Groups;
	programs: Programs;
	selectedGroup: Group | null;
	isCreateDrawerOpen: boolean;
}

export const GroupListScene = ({
	groups,
	programs,
	selectedGroup,
	isCreateDrawerOpen,
}: IProps) => {
	const router = useRouter();
	const { isAdmin } = useCurrentUser();
	const createGroup = trpcClient.groups.createGroup.useMutation({
		onSuccess: (group) => {
			router.push(routes.groups.view(group.id));
			router.refresh();
		},
		onError: (error) => toast.error(error.message),
	});
	const updateGroup = trpcClient.groups.updateGroup.useMutation({
		onSuccess: () => router.refresh(),
		onError: (error) => toast.error(error.message),
	});
	const deleteGroup = trpcClient.groups.deleteGroup.useMutation({
		onSuccess: () => {
			router.push(routes.groups.list());
			router.refresh();
		},
		onError: (error) => toast.error(error.message),
	});
	const syncRca = trpcClient.activities.syncRca.useMutation({
		onSuccess: (result) => {
			toast.success("Synced from RCA", {
				description: `${result.programs.upserted} programs · ${result.memberships.upserted} memberships`,
			});
			router.refresh();
		},
		onError: (error) => toast.error(error.message),
	});

	const lastSyncedAt = programs.reduce<string | null>(
		(latest, program) =>
			program.syncedAt && (!latest || program.syncedAt > latest)
				? program.syncedAt
				: latest,
		null,
	);

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader breadcrumbs={[{ label: "Groups" }]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-wrap items-start justify-between gap-4 p-4 lg:px-6">
							<div className="space-y-1">
								<Heading as="h1">Groups</Heading>
								<p className="text-muted-foreground max-w-2xl text-sm">
									Groups fill automatically from RCA membership type. Every
									group gets its own dashboard, chat and schedule.
								</p>
							</div>
							{isAdmin && (
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={syncRca.isPending}
										onClick={() => syncRca.mutate()}
									>
										{syncRca.isPending ? (
											<Loader2 className="animate-spin" />
										) : (
											<IconRefresh />
										)}
										Sync from RCA
									</Button>
									<Button asChild size="sm">
										<Link href={routes.groups.create()}>
											<IconPlus />
											New group
										</Link>
									</Button>
								</div>
							)}
						</div>
						<GroupTable
							groups={groups}
							lastSyncedAt={lastSyncedAt}
							canEdit={isAdmin}
						/>
					</div>
				</div>
			</SidebarInset>
			{isAdmin && (
				<GroupCreateDrawer
					isOpen={isCreateDrawerOpen}
					programs={programs}
					onSubmit={async (data) => {
						await createGroup.mutateAsync(data);
					}}
					onClose={() => router.push(routes.groups.list())}
				/>
			)}
			<GroupDetailsDrawer
				isOpen={!!selectedGroup}
				group={selectedGroup}
				programs={programs}
				canEdit={isAdmin}
				onSubmit={async (data) => {
					await updateGroup.mutateAsync(data);
				}}
				onDelete={async (id) => {
					await deleteGroup.mutateAsync({ id });
				}}
				onClose={() => router.push(routes.groups.list())}
			/>
		</SidebarProvider>
	);
};
