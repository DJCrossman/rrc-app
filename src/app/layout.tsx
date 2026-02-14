import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type React from "react";
import { FeedbackButton } from "@/components/feedback-button";
import { AuthenticatedLayout, ReactQueryProvider } from "@/components/layouts";
import { Toaster } from "@/components/ui/sonner";
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
				<ReactQueryProvider>
					<AuthenticatedLayout>
						{children}
						<Toaster />
						<FeedbackButton />
					</AuthenticatedLayout>
				</ReactQueryProvider>
			</body>
		</html>
	);
}
