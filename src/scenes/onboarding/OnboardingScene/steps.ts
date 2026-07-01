export type OnboardingStepId =
	| "welcome"
	| "details"
	| "rca"
	| "concept2"
	| "strava"
	| "done";

export interface OnboardingStepDef {
	id: OnboardingStepId;
	title: string;
}

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
	{ id: "welcome", title: "Welcome" },
	{ id: "details", title: "Your details" },
	{ id: "rca", title: "Rowing Canada" },
	{ id: "concept2", title: "Concept2" },
	{ id: "strava", title: "Strava" },
	{ id: "done", title: "All set" },
];

export function getOnboardingSteps(): OnboardingStepDef[] {
	return ONBOARDING_STEPS;
}

export function isOnboardingStepId(value: string): value is OnboardingStepId {
	return ONBOARDING_STEPS.some((step) => step.id === value);
}
