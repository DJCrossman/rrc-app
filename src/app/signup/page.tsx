import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SignUpScene } from "@/scenes/auth/SignUpScene";

export const metadata: Metadata = {
	title: "Sign Up · Regina Rowing Club",
	description: "Create an account for the Regina Rowing Club",
};

const querySchema = z.object({
	code: z.string().optional().catch(undefined),
	__clerk_ticket: z.string().optional().catch(undefined),
	__clerk_status: z.string().optional().catch(undefined),
});

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const {
		code,
		__clerk_ticket: ticket,
		__clerk_status: status,
	} = querySchema.parse(await searchParams);
	if (ticket && status === "sign_in") {
		redirect(`/login?__clerk_ticket=${encodeURIComponent(ticket)}`);
	}
	if (status === "complete") {
		redirect("/");
	}
	return <SignUpScene initialCode={code} invitationTicket={ticket} />;
}
