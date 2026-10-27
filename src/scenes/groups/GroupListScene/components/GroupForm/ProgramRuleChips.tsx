"use client";

import { IconCheck } from "@tabler/icons-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Toggle } from "@/components/ui/toggle";
import type { Programs } from "@/lib/trpc/types";
import { getProgramStatus } from "../ProgramHoverCard/getProgramStatus";
import { ProgramHoverCard } from "../ProgramHoverCard/ProgramHoverCard";

interface ProgramRuleChipsProps {
	programs: Programs;
	value: string[];
	onChange: (programIds: string[]) => void;
}

export function ProgramRuleChips({
	programs,
	value,
	onChange,
}: ProgramRuleChipsProps) {
	const pastPrograms = programs.filter(
		(program) => getProgramStatus(program) === "ended",
	);
	const currentPrograms = programs.filter(
		(program) => !pastPrograms.includes(program),
	);
	const toggle = (programId: string, isIncluded: boolean) =>
		onChange(
			isIncluded
				? [...value, programId]
				: value.filter((id) => id !== programId),
		);

	if (!programs.length) {
		return (
			<p className="text-muted-foreground text-sm">
				No RCA memberships yet. Sync from RCA to load them.
			</p>
		);
	}

	return (
		<div className="space-y-1">
			<div className="flex flex-wrap gap-2">
				{currentPrograms.map((program) => (
					<ProgramRuleToggle
						key={program.id}
						program={program}
						isIncluded={value.includes(program.id)}
						onIncludedChange={toggle}
					/>
				))}
			</div>
			{pastPrograms.length > 0 && (
				<Accordion
					type="single"
					collapsible
					defaultValue={
						pastPrograms.some((program) => value.includes(program.id))
							? "past"
							: undefined
					}
				>
					<AccordionItem value="past">
						<AccordionTrigger className="text-muted-foreground group py-2 font-normal">
							<span className="group-data-[state=open]:hidden">
								Show past memberships
							</span>
							<span className="hidden group-data-[state=open]:inline">
								Hide past memberships
							</span>
						</AccordionTrigger>
						<AccordionContent className="flex flex-wrap gap-2 pb-0">
							{pastPrograms.map((program) => (
								<ProgramRuleToggle
									key={program.id}
									program={program}
									isIncluded={value.includes(program.id)}
									onIncludedChange={toggle}
								/>
							))}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			)}
		</div>
	);
}

function ProgramRuleToggle({
	program,
	isIncluded,
	onIncludedChange,
}: {
	program: Programs[number];
	isIncluded: boolean;
	onIncludedChange: (programId: string, isIncluded: boolean) => void;
}) {
	return (
		<ProgramHoverCard program={program}>
			<Toggle
				variant="outline"
				size="sm"
				className="rounded-full px-3 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
				pressed={isIncluded}
				onPressedChange={(pressed) => onIncludedChange(program.id, pressed)}
			>
				{isIncluded && <IconCheck />}
				{program.name}
			</Toggle>
		</ProgramHoverCard>
	);
}
