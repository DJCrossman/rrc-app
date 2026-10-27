import { IconMessageCircle } from "@tabler/icons-react";

interface ChatEmptyStateProps {
	title: string;
	description: string;
}

export function ChatEmptyState({ title, description }: ChatEmptyStateProps) {
	return (
		<div className="flex flex-1 flex-col items-center gap-2 px-6 pt-10 pb-6 text-center">
			<div className="flex size-12 items-center justify-center rounded-xl bg-muted">
				<IconMessageCircle className="size-[22px]" />
			</div>
			<p className="text-[15px] font-semibold">{title}</p>
			<p className="max-w-sm text-[13px] text-muted-foreground">
				{description}
			</p>
		</div>
	);
}
