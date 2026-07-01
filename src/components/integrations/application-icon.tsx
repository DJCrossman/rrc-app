import { IconBrandStrava } from "@tabler/icons-react";

export const ApplicationIcon = ({ id }: { id: string }) => {
	switch (id) {
		case "concept2":
			return (
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
					<span className="text-2xl font-bold">C2</span>
				</div>
			);
		case "strava":
			return (
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FC4C02]">
					<IconBrandStrava className="h-8 w-8 text-white" />
				</div>
			);
		case "rca":
			return (
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#C8102E]">
					<span className="text-lg font-bold text-white">RCA</span>
				</div>
			);
		default:
			return (
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
					<span className="text-2xl font-bold">?</span>
				</div>
			);
	}
};
