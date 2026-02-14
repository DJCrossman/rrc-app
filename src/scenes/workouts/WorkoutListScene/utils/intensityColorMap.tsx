"use client";
import type { IntensityCategory } from "@/schemas";

export const intensityColorMap = {
	C1: "bg-intensity-100/20 text-white",
	C2: "bg-intensity-200/20 text-white",
	C3: "bg-intensity-300/20 text-foreground",
	C4: "bg-intensity-400/20 text-foreground",
	C5: "bg-intensity-500/20 text-foreground",
	C6: "bg-intensity-600/20 text-foreground",
} satisfies Record<IntensityCategory, string>;
