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

export const intensityActiveSelectorMap = {
	C1: "data-pressed:bg-intensity-100 data-pressed:text-white",
	C2: "data-pressed:bg-intensity-200 data-pressed:text-white",
	C3: "data-pressed:bg-intensity-300 data-pressed:text-foreground",
	C4: "data-pressed:bg-intensity-400 data-pressed:text-foreground",
	C5: "data-pressed:bg-intensity-500 data-pressed:text-foreground",
	C6: "data-pressed:bg-intensity-600 data-pressed:text-foreground",
} satisfies Record<IntensityCategory, string>;
