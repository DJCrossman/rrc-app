import { splitTextByUrls } from "@/lib/chat/links";

export function LinkifiedText({ text }: { text: string }) {
	return splitTextByUrls(text).map((part, index) => {
		if (part.kind === "text") {
			return part.value;
		}
		const isInternal =
			part.value.startsWith("/") ||
			(typeof window !== "undefined" &&
				part.value.startsWith(window.location.origin));
		return (
			<a
				// biome-ignore lint/suspicious/noArrayIndexKey: parts come from static text
				key={index}
				href={part.value}
				target={isInternal ? undefined : "_blank"}
				rel={isInternal ? undefined : "noreferrer"}
				className="break-all text-blue-400 underline-offset-2 hover:underline"
			>
				{part.value}
			</a>
		);
	});
}
