"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";

interface NotifyToggleProps {
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}

export const NotifyToggle = ({
	label,
	checked,
	onCheckedChange,
}: NotifyToggleProps) => {
	const id = useId();
	return (
		<Field orientation="horizontal">
			<Checkbox
				id={id}
				checked={checked}
				onCheckedChange={(value) => onCheckedChange(value === true)}
			/>
			<FieldLabel htmlFor={id} className="font-normal">
				{label}
			</FieldLabel>
		</Field>
	);
};

export const notifyAthletesLabel = (count: number) =>
	`Notify ${count} ${count === 1 ? "athlete" : "athletes"}`;
