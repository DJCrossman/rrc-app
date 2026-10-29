"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";

export const NotFoundScene = () => {
	const router = useRouter();

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
				<SiteHeader breadcrumbs={[{ label: "Page not found" }]} />
				<div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
					<Image
						src="/not-found.svg"
						alt="A rowing crew capsizing with their oars flying out of the water"
						width={957}
						height={566}
						className="h-auto w-full max-w-md"
					/>
					<div className="flex max-w-sm flex-col items-center gap-2">
						<span className="text-sm font-semibold tracking-widest text-muted-foreground">
							404
						</span>
						<Heading as="h1">Caught a crab</Heading>
						<p className="text-muted-foreground">
							The page you're looking for doesn't exist or may have moved.
						</p>
					</div>
					<Button
						onClick={() => {
							if (window.history.length > 1) {
								router.back();
							} else {
								router.push(routes.dashboard.home());
							}
						}}
					>
						<IconArrowLeft />
						Go back
					</Button>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};
