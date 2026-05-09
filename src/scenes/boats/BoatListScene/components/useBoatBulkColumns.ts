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

const manufacturerEditor = selectEditor<Partial<BulkCreateBoatRow>>(
	[...ManufacturerTypes],
	(option) => formatManufacturer(option as BulkCreateBoatRow["manufacturer"]),
);

const seatsEditor = selectEditor<Partial<BulkCreateBoatRow>>(
	[...SeatTypes],
	(option, row) =>
		formatSeatSetup({
			seats: option as BulkCreateBoatRow["seats"],
			rigging: row.rigging,
		}),
);

const riggingEditor = selectEditor<Partial<BulkCreateBoatRow>>(
	[...RiggingTypes],
	(option) => option.charAt(0).toUpperCase() + option.slice(1),
);

const weightUnitEditor = selectEditor<Partial<BulkCreateBoatRow>>(
	[...WeightUnitTypes],
	(option) => option.charAt(0).toUpperCase() + option.slice(1),
);

export function useBoatBulkColumns(): readonly Column<
	Partial<BulkCreateBoatRow>
>[] {
	return useMemo(
		() => [
			{
				key: "name",
				name: "Name",
				renderEditCell: textEditor,
				editable: true,
			},
			{
				key: "manufacturer",
				name: "Manufacturer",
				renderEditCell: manufacturerEditor,
				editable: true,
				renderCell: ({ row }) =>
					row.manufacturer ? formatManufacturer(row.manufacturer) : "",
			},
			{
				key: "seats",
				name: "Seats",
				renderEditCell: seatsEditor,
				editable: true,
				renderCell: ({ row }) =>
					row.seats
						? formatSeatSetup({ seats: row.seats, rigging: row.rigging })
						: "",
			},
			{
				key: "rigging",
				name: "Rigging",
				renderEditCell: riggingEditor,
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
				renderCell: ({ row }) =>
					row.weightMin !== undefined ? String(row.weightMin) : "",
			},
			{
				key: "weightMax",
				name: "Weight Max",
				renderEditCell: textEditor,
				editable: true,
				renderCell: ({ row }) =>
					row.weightMax !== undefined ? String(row.weightMax) : "",
			},
			{
				key: "weightUnit",
				name: "Weight Unit",
				renderEditCell: weightUnitEditor,
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
