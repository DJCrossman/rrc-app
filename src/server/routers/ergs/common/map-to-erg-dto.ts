import type { erg as ErgRow } from "@/generated/prisma/client";

export const mapToErgDto = ({
	erg,
	meters,
}: {
	erg: ErgRow;
	meters: number;
}) => ({
	id: erg.id,
	name: erg.name,
	manufacturer: erg.manufacturer as "concept2",
	firmwareVersion: erg.firmwareVersion,
	hardwareVersion: erg.hardwareVersion,
	serialNumber: erg.serialNumber,
	dataCode: erg.dataCode,
	meters,
});
