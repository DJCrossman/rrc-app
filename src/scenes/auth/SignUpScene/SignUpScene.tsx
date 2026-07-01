"use client";

import { useClerk, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { envVars } from "@/lib/env";

type Phase = "code" | "account" | "verify" | "finishing";

function getErrorMessage(error: unknown, fallback: string): string {
	if (typeof error === "object" && error !== null && "errors" in error) {
		const { errors } = error as { errors?: Array<{ message?: string }> };
		if (errors?.[0]?.message) {
			return errors[0].message;
		}
	}
	return error instanceof Error ? error.message : fallback;
}

export const SignUpScene = () => {
	const router = useRouter();
	const { isLoaded, signUp, setActive } = useSignUp();
	const clerk = useClerk();

	const [phase, setPhase] = useState<Phase>("code");
	const [signupCode, setSignupCode] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [emailCode, setEmailCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Step 3: sign in the created session, create the Regina Rowing Club
	// membership (Clerk requires org membership), activate it, then onboard.
	const finishSignup = async (sessionId: string | null) => {
		setPhase("finishing");
		try {
			await setActive?.({ session: sessionId });
			await fetch("/api/v1/auth/join-default-org", { method: "POST" });
			await clerk.session?.reload();
			await clerk.setActive({
				organization: envVars.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID,
			});
		} catch {
			// The onboarding page + overlay recover any incomplete step.
		}
		router.replace("/onboarding");
	};

	const handleVerifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/v1/auth/verify-signup-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: signupCode }),
			});
			const data = await response.json();
			if (!response.ok) {
				setError(data.error || "Invalid signup code");
				return;
			}
			setPhase("account");
		} catch (_err) {
			setError("Failed to verify signup code. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateAccount = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isLoaded) return;
		setIsLoading(true);
		setError(null);
		try {
			const result = await signUp.create({
				firstName,
				lastName,
				emailAddress: email,
				password,
			});
			if (result.status === "complete") {
				await finishSignup(result.createdSessionId);
				return;
			}
			await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
			setPhase("verify");
		} catch (err) {
			setError(getErrorMessage(err, "Could not create your account."));
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyEmail = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isLoaded) return;
		setIsLoading(true);
		setError(null);
		try {
			const result = await signUp.attemptEmailAddressVerification({
				code: emailCode,
			});
			if (result.status !== "complete") {
				setError("Verification incomplete. Check the code and try again.");
				return;
			}
			await finishSignup(result.createdSessionId);
		} catch (err) {
			setError(getErrorMessage(err, "Could not verify your email."));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<a
						href={envVars.NEXT_PUBLIC_HOME_URL}
						className="flex items-center gap-2 font-medium"
					>
						<Image
							src="/logo.png"
							alt="Regina Rowing Club Logo"
							width={24}
							height={24}
						/>
						<span className="text-base font-semibold">Regina Rowing Club</span>
					</a>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-md">
						{phase === "code" && (
							<div className="space-y-6">
								<div className="space-y-2 text-center">
									<h1 className="text-2xl font-bold">Sign Up</h1>
									<p className="text-sm text-muted-foreground">
										Enter your signup code to create an account
									</p>
								</div>
								<form onSubmit={handleVerifyCode} className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="signupCode">Signup Code</Label>
										<Input
											id="signupCode"
											type="text"
											placeholder="Enter your signup code"
											value={signupCode}
											onChange={(e) => setSignupCode(e.target.value)}
											required
											disabled={isLoading}
										/>
									</div>
									{error && (
										<div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
											{error}
										</div>
									)}
									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading ? "Verifying..." : "Verify Code"}
									</Button>
								</form>
								<p className="text-center text-sm text-muted-foreground">
									Don't have a signup code?{" "}
									<a
										href={envVars.NEXT_PUBLIC_HOME_URL}
										className="underline hover:text-primary"
									>
										Contact Regina Rowing Club
									</a>
								</p>
							</div>
						)}

						{phase === "account" && (
							<div className="space-y-6">
								<div className="space-y-2 text-center">
									<h1 className="text-2xl font-bold">Create Your Account</h1>
									<p className="text-sm text-muted-foreground">
										Your signup code has been verified
									</p>
								</div>
								<form onSubmit={handleCreateAccount} className="space-y-4">
									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-2">
											<Label htmlFor="firstName">First name</Label>
											<Input
												id="firstName"
												type="text"
												autoComplete="given-name"
												value={firstName}
												onChange={(e) => setFirstName(e.target.value)}
												required
												disabled={isLoading}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="lastName">Last name</Label>
											<Input
												id="lastName"
												type="text"
												autoComplete="family-name"
												value={lastName}
												onChange={(e) => setLastName(e.target.value)}
												required
												disabled={isLoading}
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											autoComplete="email"
											placeholder="you@example.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
											disabled={isLoading}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="password">Password</Label>
										<Input
											id="password"
											type="password"
											autoComplete="new-password"
											placeholder="Create a password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											required
											disabled={isLoading}
										/>
									</div>
									{error && (
										<div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
											{error}
										</div>
									)}
									<div id="clerk-captcha" />
									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading ? "Creating account..." : "Create account"}
									</Button>
								</form>
							</div>
						)}

						{phase === "verify" && (
							<div className="space-y-6">
								<div className="space-y-2 text-center">
									<h1 className="text-2xl font-bold">Verify your email</h1>
									<p className="text-sm text-muted-foreground">
										Enter the code we sent to {email}
									</p>
								</div>
								<form onSubmit={handleVerifyEmail} className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="emailCode">Verification code</Label>
										<Input
											id="emailCode"
											type="text"
											inputMode="numeric"
											autoComplete="one-time-code"
											placeholder="Enter the 6-digit code"
											value={emailCode}
											onChange={(e) => setEmailCode(e.target.value)}
											required
											disabled={isLoading}
										/>
									</div>
									{error && (
										<div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
											{error}
										</div>
									)}
									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading ? "Verifying..." : "Verify & continue"}
									</Button>
								</form>
							</div>
						)}

						{phase === "finishing" && (
							<div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								<p className="text-sm text-muted-foreground">
									Setting up your account…
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
			<div className="bg-muted relative hidden lg:block">
				<Image
					src="/login.jpeg"
					alt="Three rowers on the water"
					fill={true}
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
		</div>
	);
};
