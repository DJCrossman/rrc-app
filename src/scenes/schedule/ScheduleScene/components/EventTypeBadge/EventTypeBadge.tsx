import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EventType } from "@/schemas";

interface EventTypeBadgeProps {
	type: EventType;
	label: string;
	className?: string;
}

export const EventTypeBadge = ({
	type,
	label,
	className,
}: EventTypeBadgeProps) => (
	<Badge
		className={cn(
			"border-transparent text-foreground",
			{
				training: "bg-chart-2/30",
				regatta: "bg-chart-5/30",
				volunteer: "bg-chart-3/30",
			}[type],
			className,
		)}
	>
		{label}
	</Badge>
);
