import type { Boat } from "../../schemas/boat.schema";

export const formatManufacturer = (manufacturer: Boat["manufacturer"]) => {
	if (manufacturer === "kaschper_racing_shells_ltd") {
		return "Kaschper Racing Shells Ltd";
	}
	if (manufacturer === "liteboat_canada") {
		return "Liteboat Canada";
	}
	if (manufacturer === "swift_racing_canada") {
		return "Swift Racing Canada";
	}
	if (manufacturer === "whitehall_rowing_and_sail") {
		return "Whitehall Rowing & Sail";
	}
	if (manufacturer === "paluski_boats") {
		return "Paluski Boats";
	}
	return manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1);
};
