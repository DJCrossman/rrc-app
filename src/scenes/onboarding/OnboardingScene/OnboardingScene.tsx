"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccountSetupOverlay } from "@/components/auth/account-setup-overlay";
import { generateQueryKey } from "@/lib/keygen";
import { trpcClient } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/types";
import { OnboardingProgress } from "./OnboardingProgress";
import {
	getOnboardingSteps,
	isOnboardingStepId,
	type OnboardingStepId,
} from "./steps";
import type { DetailsStepDefaults } from "./steps/DetailsStep";
import { DetailsStep } from "./steps/DetailsStep";
import { DoneStep } from "./steps/DoneStep";
import { OAuthIntegrationStep } from "./steps/OAuthIntegrationStep";
import { RowingCanadaStep } from "./steps/RowingCanadaStep";
import { WelcomeStep } from "./steps/WelcomeStep";

type CurrentUserResult = RouterOutputs["users"]["getCurrentUser"];

interface OnboardingSceneProps {
	step?: string;
	defaultFirstName?: string;
	defaultLastName?: string;
	initialUser: CurrentUserResult;
}

export function OnboardingScene({
	step,
	defaultFirstName,
	defaultLastName,
	initialUser,
}: OnboardingSceneProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const utils = trpcClient.useUtils();
	const [isFinishing, setIsFinishing] = useState(false);

	const { data } = trpcClient.users.getCurrentUser.useQuery(undefined, {
		initialData: initialUser,
	});
	const currentUser = data ?? initialUser;
	const { isAdmin, hasAthlete, user } = currentUser;

	const steps = getOnboardingSteps();
	const stepIds = steps.map((entry) => entry.id);

	const requestedStep =
		step && isOnboardingStepId(step) && stepIds.includes(step)
			? step
			: undefined;
	const [activeStep, setActiveStep] = useState<OnboardingStepId>(
		requestedStep ?? "welcome",
	);
	const currentStepId = stepIds.includes(activeStep) ? activeStep : "welcome";

	const goTo = (id: OnboardingStepId) => {
		setActiveStep(id);
		router.replace(`/onboarding?step=${id}`, { scroll: false });
	};

	const goNext = () => {
		const index = stepIds.indexOf(currentStepId);
		goTo(stepIds[index + 1] ?? "done");
	};

	const goBack = () => {
		const index = stepIds.indexOf(currentStepId);
		const previous = stepIds[index - 1];
		if (previous) goTo(previous);
	};

	const refetchUser = async () => {
		await utils.users.getCurrentUser.invalidate();
	};

	const handleDetailsCompleted = async () => {
		await refetchUser();
		goNext();
	};

	const finishOnboarding = async () => {
		setIsFinishing(true);
		await utils.users.getCurrentUser.invalidate();
		await queryClient.invalidateQueries({
			queryKey: generateQueryKey({ type: "currentUser" }),
		});
		router.replace("/");
	};

	// Admins can skip onboarding entirely and use the app without an athlete.
	const skipToApp = () => {
		router.replace("/");
	};

	const detailsDefaults: DetailsStepDefaults =
		hasAthlete && user
			? {
					firstName: user.firstName ?? "",
					lastName: user.lastName ?? "",
					nickname: user.nickname ?? "",
					phone: user.phone ?? "",
					gender: user.gender,
					dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
				}
			: {
					firstName: defaultFirstName ?? "",
					lastName: defaultLastName ?? "",
					nickname: "",
					phone: "",
					gender: undefined,
					dateOfBirth: "",
				};

	const renderStep = () => {
		switch (currentStepId) {
			case "welcome":
				return (
					<WelcomeStep
						isAdmin={isAdmin}
						onNext={goNext}
						onSkipToApp={skipToApp}
					/>
				);
			case "details":
				return (
					<DetailsStep
						mode={hasAthlete ? "update" : "create"}
						defaultValues={detailsDefaults}
						onCompleted={handleDetailsCompleted}
						onBack={goBack}
					/>
				);
			case "rca":
				return (
					<RowingCanadaStep
						connected={user?.rcaConnected ?? false}
						onContinue={goNext}
						onSkip={goNext}
						onBack={goBack}
						onConnected={refetchUser}
					/>
				);
			case "concept2":
				return (
					<OAuthIntegrationStep
						provider="concept2"
						connected={user?.concept2Connected ?? false}
						onContinue={goNext}
						onSkip={goNext}
						onBack={goBack}
					/>
				);
			case "strava":
				return (
					<OAuthIntegrationStep
						provider="strava"
						connected={user?.stravaConnected ?? false}
						onContinue={goNext}
						onSkip={goNext}
						onBack={goBack}
					/>
				);
			case "done":
				return (
					<DoneStep
						isAdmin={isAdmin}
						isFinishing={isFinishing}
						onFinish={finishOnboarding}
					/>
				);
		}
	};

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center p-6">
			<AccountSetupOverlay />
			<div className="mb-8">
				<OnboardingProgress steps={steps} currentStepId={currentStepId} />
			</div>
			<div className="rounded-lg border bg-background p-6 shadow-sm">
				{renderStep()}
			</div>
		</div>
	);
}
