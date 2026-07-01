import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingStepDef, OnboardingStepId } from "./steps";

interface OnboardingProgressProps {
	steps: OnboardingStepDef[];
	currentStepId: OnboardingStepId;
}

export function OnboardingProgress({
	steps,
	currentStepId,
}: OnboardingProgressProps) {
	const currentIndex = steps.findIndex((step) => step.id === currentStepId);

	return (
		<ol className="flex items-start justify-between gap-1">
			{steps.map((step, index) => {
				const isComplete = index < currentIndex;
				const isCurrent = index === currentIndex;
				return (
					<li
						key={step.id}
						className="flex flex-1 flex-col items-center gap-2 text-center"
					>
						<div
							className={cn(
								"flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
								isCurrent &&
									"border-primary bg-primary text-primary-foreground",
								isComplete && "border-primary bg-primary/10 text-primary",
								!isCurrent &&
									!isComplete &&
									"border-border text-muted-foreground",
							)}
						>
							{isComplete ? <Check className="h-4 w-4" /> : index + 1}
						</div>
						<span
							className={cn(
								"whitespace-nowrap text-xs",
								isCurrent
									? "font-medium text-foreground"
									: "text-muted-foreground",
							)}
						>
							{step.title}
						</span>
					</li>
				);
			})}
		</ol>
	);
}
