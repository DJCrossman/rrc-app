import type { Metadata } from "next";
import { SignUpScene } from "@/scenes/auth/SignUpScene";

export const metadata: Metadata = {
	title: "Sign Up · Regina Rowing Club",
	description: "Create an account for the Regina Rowing Club",
};

export default function SignUpPage() {
	return <SignUpScene />;
}
