import { useMemo } from "react";
import type { Column } from "react-data-grid";
import {
	selectEditor,
	textEditor,
} from "@/components/bulk-upload-drawer.editors";
import { formatManufacturer, formatSeatSetup } from "@/lib/formatters";
import {
	type BulkCreateBoatRow,
	ManufacturerTypes,
	RiggingTypes,
	SeatTypes,
	WeightUnitTypes,
} from "@/schemas";

export function useBoatBulkColumns(): readonly Column<
	Partial<BulkCreateBoatRow>
>[] {
	return useMemo(
		() => [
			{ key: "name", name: "Name", renderEditCell: textEditor, editable: true },
			{
				key: "manufacturer",
				name: "Manufacturer",
				renderEditCell: selectEditor<Partial<BulkCreateBoatRow>>(
					[...ManufacturerTypes],
					(option) =>
						formatManufacturer(option as BulkCreateBoatRow["manufacturer"]),
				),
				editable: true,
				renderCell: ({ row }) =>
					row.manufacturer ? formatManufacturer(row.manufacturer) : "",
			},
			{
				key: "seats",
				name: "Seats",
				renderEditCell: selectEditor<Partial<BulkCreateBoatRow>>(
					[...SeatTypes],
					(option, row) =>
						formatSeatSetup({
							seats: option as BulkCreateBoatRow["seats"],
							rigging: row.rigging,
						}),
				),
				editable: true,
				renderCell: ({ row }) =>
					row.seats
						? formatSeatSetup({ seats: row.seats, rigging: row.rigging })
						: "",
			},
			{
				key: "rigging",
				name: "Rigging",
				renderEditCell: selectEditor<Partial<BulkCreateBoatRow>>(
					[...RiggingTypes],
					(option) => option.charAt(0).toUpperCase() + option.slice(1),
				),
				editable: true,
				renderCell: ({ row }) =>
					row.rigging
						? row.rigging.charAt(0).toUpperCase() + row.rigging.slice(1)
						: "",
			},
			{
				key: "weightMin",
				name: "Weight Min",
				renderEditCell: textEditor,
				editable: true,
			},
			{
				key: "weightMax",
				name: "Weight Max",
				renderEditCell: textEditor,
				editable: true,
			},
			{
				key: "weightUnit",
				name: "Weight Unit",
				renderEditCell: selectEditor<Partial<BulkCreateBoatRow>>(
					[...WeightUnitTypes],
					(option) => option.charAt(0).toUpperCase() + option.slice(1),
				),
				editable: true,
				renderCell: ({ row }) =>
					row.weightUnit
						? row.weightUnit.charAt(0).toUpperCase() + row.weightUnit.slice(1)
						: "",
			},
		],
		[],
	);
}
