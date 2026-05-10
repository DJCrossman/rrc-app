import { type AfterableBuilder, wrapBuilder } from "../builder";
import type { OnboardingContext } from "../context";
import { requireAuthAndNoAthlete } from "../middleware/auth";
import { baseProcedure } from "../trpc";

export const onboardingProcedure: AfterableBuilder<
	OnboardingContext,
	undefined
> = wrapBuilder<OnboardingContext, undefined>(
	baseProcedure.use(requireAuthAndNoAthlete),
);
