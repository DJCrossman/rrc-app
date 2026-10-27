import { IconCheck } from "@tabler/icons-react";
import type { ChatTarget } from "@/lib/chat/targets";
import { cn } from "@/lib/utils";
import { ChannelIcon } from "./channel-icon";

interface ChatTargetListProps {
	targets: ChatTarget[];
	selectedKey: string;
	isLoading: boolean;
	onSelect: (key: string) => void;
}

export function ChatTargetList({
	targets,
	selectedKey,
	isLoading,
	onSelect,
}: ChatTargetListProps) {
	return (
		<div className="max-h-56 overflow-y-auto rounded-lg border border-input p-1">
			{targets.map((target) => {
				const isSelected = target.key === selectedKey;
				return (
					<button
						key={target.key}
						type="button"
						aria-pressed={isSelected}
						onClick={() => onSelect(target.key)}
						className={cn(
							"flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm hover:bg-muted",
							isSelected && "bg-muted",
						)}
					>
						<ChannelIcon channel={target} className="text-muted-foreground" />
						<span className="min-w-0 flex-1 truncate">{target.name}</span>
						<span className="text-xs text-muted-foreground">
							{target.kind === "direct_message" ? "DM" : "Group"}
						</span>
						<IconCheck className={cn("size-4", !isSelected && "invisible")} />
					</button>
				);
			})}
			{isLoading && (
				<p className="px-2.5 py-2 text-xs text-muted-foreground">
					Loading members…
				</p>
			)}
			{!isLoading && targets.length === 0 && (
				<p className="px-2.5 py-2 text-sm text-muted-foreground">
					There's no other group or member to send to yet.
				</p>
			)}
		</div>
	);
}
