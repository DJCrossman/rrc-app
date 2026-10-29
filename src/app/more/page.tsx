import type { Metadata } from "next";
import { MoreScene } from "@/scenes/more/MoreScene/MoreScene";

export const metadata: Metadata = {
	title: "More · Regina Rowing Club",
};

export default function MorePage() {
	return <MoreScene />;
}
