import type React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterChipProps
	extends Omit<React.ComponentProps<typeof Button>, "variant" | "size"> {
	isActive: boolean;
}

export const FilterChip = ({
	isActive,
	className,
	...props
}: FilterChipProps) => (
	<Button
		type="button"
		size="sm"
		variant={isActive ? "secondary" : "outline"}
		aria-pressed={isActive}
		className={cn("h-7 rounded-full px-3 text-xs", className)}
		{...props}
	/>
);
