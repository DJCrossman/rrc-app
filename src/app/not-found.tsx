import type { Metadata } from "next";
import { NotFoundScene } from "@/scenes/not-found/NotFoundScene/NotFoundScene";

export const metadata: Metadata = {
	title: "Page not found · Regina Rowing Club",
};

export default function NotFound() {
	return <NotFoundScene />;
}
