import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type React from "react";
import { AuthenticatedLayout } from "@/components/layouts";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/lib/trpc/Provider";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Regina Rowing Club",
	description: "Application for the Regina Rowing Club",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
			>
				<ClerkProvider>
					<TRPCReactProvider>
						<AuthenticatedLayout>
							{children}
							<Toaster />
						</AuthenticatedLayout>
					</TRPCReactProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
