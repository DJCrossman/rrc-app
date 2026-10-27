import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const SIZES = {
	xs: "size-5 rounded-[5px] text-[9px] font-semibold",
	sm: "size-8 rounded-lg text-xs font-medium",
	md: "size-9 rounded-lg text-[13px] font-medium",
};

interface InitialsAvatarProps {
	initials: string;
	name?: string;
	size?: keyof typeof SIZES;
	className?: string;
}

export function InitialsAvatar({
	initials,
	name,
	size = "md",
	className,
}: InitialsAvatarProps) {
	return (
		<Avatar className={cn(SIZES[size], className)} title={name}>
			<AvatarFallback className="rounded-[inherit] bg-muted">
				{initials}
			</AvatarFallback>
		</Avatar>
	);
}
