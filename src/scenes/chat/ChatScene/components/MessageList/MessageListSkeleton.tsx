import { Skeleton } from "@/components/ui/skeleton";

const WIDTHS = ["w-2/3", "w-1/2", "w-3/4", "w-1/3"];

export function MessageListSkeleton({ rows = 6 }: { rows?: number }) {
	return (
		<div
			aria-hidden="true"
			className="flex flex-1 flex-col justify-end gap-5 px-4 py-4 lg:px-6"
		>
			{WIDTHS.concat(WIDTHS)
				.slice(0, rows)
				.map((width, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
					<div key={index} className="flex gap-3">
						<Skeleton className="size-9 rounded-lg" />
						<div className="flex flex-1 flex-col gap-2 pt-0.5">
							<Skeleton className="h-3.5 w-32" />
							<Skeleton className={`h-3.5 ${width}`} />
						</div>
					</div>
				))}
		</div>
	);
}
