import type { Metadata } from "next";
import { z } from "zod";
import { SignUpScene } from "@/scenes/auth/SignUpScene";

export const metadata: Metadata = {
	title: "Sign Up · Regina Rowing Club",
	description: "Create an account for the Regina Rowing Club",
};

const querySchema = z.object({
	code: z.string().optional().catch(undefined),
});

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { code } = querySchema.parse(await searchParams);
	return <SignUpScene initialCode={code} />;
}
