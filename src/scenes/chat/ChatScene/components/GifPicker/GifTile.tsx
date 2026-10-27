import { cn } from "@/lib/utils";

const VARIANTS = {
	message: "h-40 w-60 justify-between rounded-[10px] p-2.5",
	compact: "h-[130px] w-[200px] rounded-lg p-2",
	picker: "h-[100px] w-full rounded-lg p-2",
};

export function GifTile({
	label,
	variant = "message",
	className,
}: {
	label: string;
	variant?: keyof typeof VARIANTS;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex items-end bg-[repeating-linear-gradient(135deg,#27272a_0px,#27272a_10px,#1f1f23_10px,#1f1f23_20px)] text-left text-[11px] text-muted-foreground",
				VARIANTS[variant],
				className,
			)}
		>
			{variant === "compact" ? (
				<span>GIF · {label}</span>
			) : (
				<span>{label}</span>
			)}
			{variant === "message" && (
				<span className="rounded-[4px] bg-zinc-950 px-[5px] py-px font-medium text-zinc-50">
					GIF
				</span>
			)}
		</div>
	);
}
