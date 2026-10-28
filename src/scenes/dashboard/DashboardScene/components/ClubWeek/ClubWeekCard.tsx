import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ClubWeekCardProps {
	title: ReactNode;
	action?: ReactNode;
	className?: string;
	children: ReactNode;
}

export const ClubWeekCard = ({
	title,
	action,
	className,
	children,
}: ClubWeekCardProps) => (
	<section
		className={cn(
			"flex flex-col gap-2.5 rounded-xl border bg-card p-4 text-card-foreground",
			className,
		)}
	>
		<div className="flex min-h-7 items-start justify-between gap-2">
			<h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
				{title}
			</h3>
			{action}
		</div>
		{children}
	</section>
);

export const CountBadge = ({ count }: { count: number }) => (
	<span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-sidebar-primary px-1.5 text-xs font-semibold text-sidebar-primary-foreground">
		{count > 99 ? "99+" : count}
	</span>
);
