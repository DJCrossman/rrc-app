"use client";

import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/lib/routes";

const SETTING_TABS = [
	{ label: "My Account", value: "account", href: routes.settings.account() },
	{ label: "My Applications", value: "apps", href: routes.settings.apps() },
];

export default function SettingsLayout({ children }: React.PropsWithChildren) {
	const pathname = usePathname();
	const router = useRouter();

	const currentTab =
		SETTING_TABS.find((tab) => pathname === tab.href) || SETTING_TABS[0];

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
				<SiteHeader breadcrumbs={[currentTab]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex items-center justify-between p-4 lg:px-6">
							<Heading as="h1">My Account</Heading>
						</div>
						<div className="flex flex-col gap-4 md:gap-6">
							<Tabs value={currentTab.value} className="w-full p-4">
								<TabsList className="grid w-full max-w-md grid-cols-2">
									{SETTING_TABS.map((tab) => (
										<TabsTrigger
											key={tab.value}
											value={tab.value}
											onClick={() => router.push(tab.href)}
										>
											{tab.label}
										</TabsTrigger>
									))}
								</TabsList>
								<div className="mt-6">{children}</div>
							</Tabs>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
