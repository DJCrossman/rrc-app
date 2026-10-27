import {
	IconActivity,
	IconCalendarEvent,
	IconMapPin,
} from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatDuration } from "@/lib/formatters/formatDuration";
import { formatMeters } from "@/lib/formatters/formatMeters";
import type { ChatMessage } from "@/lib/trpc/types";

type LinkPreview = ChatMessage["previews"][number];

const ACTIVITY_TYPE_LABELS = {
	water: "On the water",
	erg: "Erg",
	crossTrain: "Cross-Train",
	strength: "S&C",
};

export function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
	if (preview.kind === "event") {
		return (
			<PreviewFrame url={preview.url}>
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<IconCalendarEvent className="size-3.5" />
					Event · {preview.typeLabel}
				</p>
				<p className="text-sm font-semibold">{preview.title}</p>
				<p className="text-xs text-muted-foreground">
					{preview.dateLabel} · {preview.timeLabel}
				</p>
				{preview.location && (
					<p className="flex items-center gap-1 text-xs text-muted-foreground">
						<IconMapPin className="size-3.5" />
						{preview.location}
					</p>
				)}
			</PreviewFrame>
		);
	}
	return (
		<PreviewFrame url={preview.url}>
			<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<IconActivity className="size-3.5" />
				Activity · {ACTIVITY_TYPE_LABELS[preview.type]}
			</p>
			<p className="text-sm font-semibold">{preview.name}</p>
			<p className="text-xs text-muted-foreground">
				{preview.athleteName} · {preview.dateLabel}
			</p>
			<p className="text-[13px] font-medium tabular-nums">
				{formatMeters(preview.distance)} · {formatDuration(preview.elapsedTime)}
			</p>
		</PreviewFrame>
	);
}

function PreviewFrame({
	url,
	children,
}: {
	url: string | null;
	children: ReactNode;
}) {
	const className =
		"flex max-w-[520px] flex-col gap-1 rounded-[10px] border border-input bg-white/[0.03] px-3 py-2.5";
	if (!url) {
		return <div className={className}>{children}</div>;
	}
	return (
		<Link href={url} className={`${className} hover:bg-white/[0.06]`}>
			{children}
		</Link>
	);
}
