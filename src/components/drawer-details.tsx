import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SectionLabel = ({
	children,
	action,
}: {
	children: ReactNode;
	action?: ReactNode;
}) => (
	<div className="flex items-center justify-between gap-2">
		<h3 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
			{children}
		</h3>
		{action}
	</div>
);

export const DetailTiles = ({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) => (
	<div className={cn("grid grid-cols-2 gap-2.5", className)}>{children}</div>
);

export const DetailTile = ({
	label,
	children,
	className,
}: {
	label: ReactNode;
	children: ReactNode;
	className?: string;
}) => (
	<div
		className={cn(
			"flex flex-col gap-1 rounded-xl border bg-background px-3.5 py-3",
			className,
		)}
	>
		<span className="text-[13px] text-muted-foreground">{label}</span>
		<span className="text-[17px] font-semibold tabular-nums">{children}</span>
	</div>
);

export const DetailList = ({ children }: { children: ReactNode }) => (
	<dl className="flex flex-col gap-2.5">{children}</dl>
);

export const DetailRow = ({
	label,
	children,
}: {
	label: ReactNode;
	children: ReactNode;
}) => (
	<div className="flex items-baseline justify-between gap-4 text-[15px]">
		<dt className="shrink-0 text-muted-foreground">{label}</dt>
		<dd className="min-w-0 text-right break-words">{children}</dd>
	</div>
);
