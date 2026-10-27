"use client";

import type { Icon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
	children,
}: {
	items: {
		title: string;
		url: string;
		icon?: Icon;
		badge?: string;
	}[];
	children?: ReactNode;
}) {
	const pathname = usePathname();
	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								tooltip={item.title}
								isActive={isActivePath(pathname, item.url)}
								asChild
							>
								<Link href={item.url}>
									{item.icon && <item.icon />}
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
							{item.badge && (
								<SidebarMenuBadge className="h-4 min-w-0 rounded-full bg-sidebar-primary px-1.5 text-[10px] font-semibold text-sidebar-primary-foreground peer-hover/menu-button:text-sidebar-primary-foreground peer-data-[active=true]/menu-button:text-sidebar-primary-foreground peer-data-[size=default]/menu-button:top-2">
									{item.badge}
								</SidebarMenuBadge>
							)}
						</SidebarMenuItem>
					))}
					{children}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

export function isActivePath(pathname: string, url: string) {
	return url === "/" ? pathname === "/" : pathname.startsWith(url);
}
