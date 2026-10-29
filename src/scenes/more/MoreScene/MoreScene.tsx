"use client";

import {
	IconApps,
	IconBell,
	IconChevronRight,
	IconLogout,
	IconMessage,
	type IconProps,
	IconSailboat2,
	IconUserCircle,
	IconUsers,
	IconUsersGroup,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentType, type ReactNode, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useAuth";
import { MOBILE_BREAKPOINT } from "@/hooks/useIsMobile";
import { openFeedback } from "@/lib/feedback";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const MoreScene = () => {
	const router = useRouter();
	const { user, isAdmin } = useCurrentUser();

	// The page only exists for the mobile tab bar; wider screens use the sidebar.
	useEffect(() => {
		const query = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
		const redirect = () => {
			if (query.matches) router.replace(routes.dashboard.home());
		};
		redirect();
		query.addEventListener("change", redirect);
		return () => query.removeEventListener("change", redirect);
	}, [router]);

	const name =
		user.nickname ||
		[user.firstName, user.lastName.charAt(0)].filter(Boolean).join(" ");
	const initials = [user.firstName, user.lastName]
		.map((part) => part.charAt(0).toUpperCase())
		.join("");

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
				<SiteHeader breadcrumbs={[{ label: "More" }]} />
				<div className="flex w-full max-w-xl flex-col gap-5 p-4 lg:px-6">
					<Heading as="h1">More</Heading>
					<Link
						href={routes.settings.account()}
						className="flex items-center gap-3.5 rounded-xl border bg-card p-3.5 text-card-foreground hover:bg-muted"
					>
						<span className="flex size-13 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-lg font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
							{initials}
						</span>
						<span className="flex min-w-0 flex-1 flex-col gap-0.5">
							<span className="truncate text-[17px] font-semibold">{name}</span>
							<span className="truncate text-[13px] text-muted-foreground">
								{[user.phone, isAdmin ? "Admin" : "Member"]
									.filter(Boolean)
									.join(" · ")}
							</span>
						</span>
						<IconChevronRight className="size-5 shrink-0 text-muted-foreground" />
					</Link>
					<MoreGroup title="Club">
						<MoreRow
							href={routes.boats.list()}
							icon={IconSailboat2}
							tint="blue"
						>
							Boats
						</MoreRow>
						{isAdmin && (
							<MoreRow
								href={routes.members.list()}
								icon={IconUsers}
								tint="green"
							>
								Members
							</MoreRow>
						)}
						<MoreRow
							href={routes.groups.list()}
							icon={IconUsersGroup}
							tint="purple"
						>
							Groups
						</MoreRow>
					</MoreGroup>
					<MoreGroup title="Settings">
						<MoreRow href={routes.settings.account()} icon={IconUserCircle}>
							My Account
						</MoreRow>
						<MoreRow href={routes.settings.notifications()} icon={IconBell}>
							Notifications
						</MoreRow>
						<MoreRow href={routes.settings.apps()} icon={IconApps}>
							Connected Apps
						</MoreRow>
					</MoreGroup>
					<MoreGroup>
						<MoreRow onClick={() => openFeedback()} icon={IconMessage}>
							Send feedback
						</MoreRow>
						<MoreRow
							href="/logout"
							icon={IconLogout}
							tint="red"
							prefetch={false}
						>
							Sign out
						</MoreRow>
					</MoreGroup>
					<p className="text-center text-xs text-muted-foreground">
						Regina Rowing Club
					</p>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};

const MoreGroup = ({
	title,
	children,
}: {
	title?: string;
	children: ReactNode;
}) => (
	<section className="flex flex-col gap-1.5">
		{title && (
			<h2 className="px-1 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
				{title}
			</h2>
		)}
		<div className="divide-y overflow-hidden rounded-xl border bg-card text-card-foreground">
			{children}
		</div>
	</section>
);

const TINTS = {
	neutral: "bg-muted text-foreground/80",
	blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
	green:
		"bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
	purple:
		"bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
	red: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

const MoreRow = ({
	href,
	onClick,
	icon: Icon,
	tint = "neutral",
	prefetch,
	children,
}: {
	icon: ComponentType<IconProps>;
	tint?: keyof typeof TINTS;
	prefetch?: boolean;
	children: ReactNode;
} & (
	| { href: string; onClick?: never }
	| { href?: never; onClick: () => void }
)) => {
	const content = (
		<>
			<span
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-[9px]",
					TINTS[tint],
				)}
			>
				<Icon className="size-[18px]" />
			</span>
			<span className="flex-1 truncate text-base">{children}</span>
			{!onClick && (
				<IconChevronRight className="size-5 shrink-0 text-muted-foreground" />
			)}
		</>
	);
	const className = cn(
		"flex min-h-13 items-center gap-3 px-3.5 hover:bg-muted",
		tint === "red" && "text-destructive",
	);
	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className={cn(className, "w-full text-left")}
			>
				{content}
			</button>
		);
	}
	return (
		<Link href={href} prefetch={prefetch} className={className}>
			{content}
		</Link>
	);
};
