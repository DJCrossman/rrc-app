import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { MobilePageHeader } from "@/components/mobile-page-header";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export const ActivityListSceneSkeleton = () => (
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
			<SiteHeader breadcrumbs={[{ label: "Activities" }]} />
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<MobilePageHeader
						title="Activities"
						actions={
							<>
								<Skeleton className="size-10 rounded-xl" />
								<Skeleton className="size-10 rounded-xl" />
							</>
						}
					/>
					<div className="flex items-center justify-between p-4 max-md:hidden lg:px-6">
						<Heading as="h1">Activities</Heading>
					</div>
					<div>
						<div className="flex flex-col gap-3 px-4 pb-3 md:flex-row md:items-center md:justify-between md:p-4 lg:px-6">
							<div className="flex gap-2">
								{Array.from({ length: 3 }, (_, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
									<Skeleton key={index} className="h-7 w-12 rounded-full" />
								))}
							</div>
							<Skeleton className="h-8 w-9 max-md:hidden lg:w-28" />
						</div>
						<div className="flex flex-col gap-4 px-4 md:gap-3 lg:px-6">
							{Array.from({ length: 2 }, (_, dayIndex) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
								<div key={dayIndex} className="flex flex-col gap-2 md:gap-1.5">
									<Skeleton className="h-4 w-20" />
									{Array.from({ length: 4 }, (_, index) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
											key={index}
											className="flex items-center gap-3 rounded-xl border bg-card p-3.5 md:rounded-lg md:px-3 md:py-2"
										>
											<Skeleton className="size-10 shrink-0 rounded-xl md:size-8 md:rounded-lg" />
											<div className="flex min-w-0 flex-1 flex-col gap-2.5">
												<Skeleton className="h-4 w-2/5" />
												<Skeleton className="h-3 w-3/5" />
												<Skeleton className="h-3 w-1/4 md:hidden" />
											</div>
											<div className="flex shrink-0 flex-col items-end gap-2.5">
												<Skeleton className="h-4 w-14" />
												<Skeleton className="h-3 w-10" />
											</div>
										</div>
									))}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</SidebarInset>
	</SidebarProvider>
);
