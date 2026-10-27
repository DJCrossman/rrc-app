import { IconSearch } from "@tabler/icons-react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

export function PickerSearch(props: ComponentProps<typeof Input>) {
	return (
		<div className="relative">
			<IconSearch className="pointer-events-none absolute top-[9px] left-2.5 size-4 text-muted-foreground" />
			<Input
				autoFocus
				aria-label={props.placeholder}
				className="h-[34px] bg-white/[0.043] pl-[30px] text-[13px] md:text-[13px] dark:bg-white/[0.043]"
				{...props}
			/>
		</div>
	);
}
