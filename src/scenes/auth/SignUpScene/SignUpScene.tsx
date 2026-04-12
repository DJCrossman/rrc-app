"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { envVars } from "@/lib/env";

export const SignUpScene = () => {
	const [signupCode, setSignupCode] = useState("");
	const [isVerified, setIsVerified] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleVerifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/v1/auth/verify-signup-code", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ code: signupCode }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Invalid signup code");
				return;
			}

			setIsVerified(true);
		} catch (_err) {
			setError("Failed to verify signup code. Please try again.");
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
						{!isVerified ? (
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
						) : (
							<div className="space-y-6">
								<div className="space-y-2 text-center">
									<h1 className="text-2xl font-bold">Create Your Account</h1>
									<p className="text-sm text-muted-foreground">
										Your signup code has been verified
									</p>
								</div>
								<SignUp
									appearance={{
										elements: {
											rootBox: "w-full",
											card: "w-full border border-border bg-background/95 shadow-none",
										},
									}}
									routing="virtual"
									redirectUrl="/"
									signInUrl="/login"
								/>
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
