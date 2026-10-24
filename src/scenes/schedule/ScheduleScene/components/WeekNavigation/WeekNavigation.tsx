import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface WeekNavigationProps {
	label: string;
	isCurrentWeek: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onThisWeek: () => void;
}

export const WeekNavigation = ({
	label,
	isCurrentWeek,
	onPrevious,
	onNext,
	onThisWeek,
}: WeekNavigationProps) => (
	<div className="flex items-center gap-2">
		<Button
			type="button"
			variant="outline"
			size="icon-sm"
			aria-label="Previous week"
			onClick={onPrevious}
		>
			<IconChevronLeft />
		</Button>
		<h2 className="min-w-44 text-center text-sm font-semibold">{label}</h2>
		<Button
			type="button"
			variant="outline"
			size="icon-sm"
			aria-label="Next week"
			onClick={onNext}
		>
			<IconChevronRight />
		</Button>
		<Button
			type="button"
			variant="ghost"
			size="sm"
			disabled={isCurrentWeek}
			onClick={onThisWeek}
		>
			This week
		</Button>
	</div>
);
