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
	C1: "data-[state=on]:bg-intensity-100 data-[state=on]:text-white",
	C2: "data-[state=on]:bg-intensity-200 data-[state=on]:text-white",
	C3: "data-[state=on]:bg-intensity-300 data-[state=on]:text-foreground",
	C4: "data-[state=on]:bg-intensity-400 data-[state=on]:text-foreground",
	C5: "data-[state=on]:bg-intensity-500 data-[state=on]:text-foreground",
	C6: "data-[state=on]:bg-intensity-600 data-[state=on]:text-foreground",
} satisfies Record<IntensityCategory, string>;
