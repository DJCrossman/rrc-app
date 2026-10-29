import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobilePageHeaderProps {
	title: ReactNode;
	backHref?: string;
	backLabel?: string;
	description?: ReactNode;
	actions?: ReactNode;
	className?: string;
	children?: ReactNode;
}

/** Phone-only page header: back link, big title, optional actions. Desktop keeps SiteHeader. */
export function MobilePageHeader({
	title,
	backHref,
	backLabel = "Back",
	description,
	actions,
	className,
	children,
}: MobilePageHeaderProps) {
	return (
		<div className={cn("flex flex-col gap-3 px-4 pt-3 md:hidden", className)}>
			{(backHref || actions) && (
				<div className="flex min-h-11 items-center justify-between gap-3">
					{backHref ? (
						<Link
							href={backHref}
							className="-ml-1.5 flex items-center gap-0.5 text-[17px] font-medium text-blue-600 dark:text-blue-400"
						>
							<IconChevronLeft className="size-5" />
							{backLabel}
						</Link>
					) : (
						<span />
					)}
					{actions && (
						<div className="flex shrink-0 items-center gap-2">{actions}</div>
					)}
				</div>
			)}
			<h1 className="text-[28px] leading-tight font-bold tracking-tight">
				{title}
			</h1>
			{description && (
				<p className="text-[15px] text-muted-foreground">{description}</p>
			)}
			{children}
		</div>
	);
}
