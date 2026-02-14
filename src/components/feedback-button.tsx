"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_FORM_URL = "https://forms.gle/3SkPKi5TXYWjgQLW9";

export function FeedbackButton() {
	return (
		<Button
			asChild
			size="sm"
			className="fixed bottom-6 right-6 z-50 gap-2 shadow-lg hover:shadow-xl transition-shadow"
		>
			<a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
				<MessageCircle className="h-4 w-4" />
				Feedback
			</a>
		</Button>
	);
}
