import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { EventResponses } from "@/lib/trpc/types";
import type { EventType } from "@/schemas";

interface EventResponsesListProps {
	type: EventType;
	responses: EventResponses;
}

export const EventResponsesList = ({
	type,
	responses,
}: EventResponsesListProps) => {
	const sections =
		type === "volunteer"
			? [
					{ label: "Signed up", people: responses.going },
					{ label: "Not signed up", people: responses.noReply },
				]
			: [
					{ label: "Going", people: responses.going },
					{ label: "Maybe", people: responses.maybe },
					{ label: "Can't go", people: responses.no },
					{ label: "No reply", people: responses.noReply },
				];

	return (
		<div className="flex flex-col gap-4">
			{sections.map((section) => (
				<section key={section.label} className="flex flex-col gap-2">
					<h4 className="text-sm font-medium">
						{section.label}{" "}
						<span className="text-muted-foreground">
							{section.people.length}
						</span>
					</h4>
					{section.people.length > 0 ? (
						<ul className="flex flex-col gap-2">
							{section.people.map((person) => (
								<li key={person.athleteId} className="flex items-center gap-3">
									<Avatar className="size-8">
										<AvatarFallback className="text-xs">
											{person.initials}
										</AvatarFallback>
									</Avatar>
									<div className="flex min-w-0 flex-col">
										<span className="truncate text-sm font-medium">
											{person.name}
										</span>
										{person.program && (
											<span className="truncate text-xs text-muted-foreground">
												{person.program}
											</span>
										)}
									</div>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">No one yet.</p>
					)}
				</section>
			))}
		</div>
	);
};
