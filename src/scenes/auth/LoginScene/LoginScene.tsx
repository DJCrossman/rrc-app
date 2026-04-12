"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { envVars } from "@/lib/env";

export const LoginScene = () => {
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
						<SignIn
							appearance={{
								elements: {
									rootBox: "w-full",
									card: "w-full border border-border bg-background/95 shadow-none",
								},
							}}
							routing="virtual"
							forceRedirectUrl="/"
							signUpUrl="/signup"
						/>
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
