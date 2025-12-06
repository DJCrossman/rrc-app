import type { Metadata } from "next";
import { LoginScene } from "@/scenes/auth/LoginScene/LoginScene";

export const metadata: Metadata = {
	title: "Login · Regina Rowing Club",
	description: "Application for the Regina Rowing Club",
};

export default function LoginPage() {
	return <LoginScene />;
}
