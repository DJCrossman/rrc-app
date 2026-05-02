import { useMemo } from "react";
import type { Column } from "react-data-grid";
import {
	dateEditor,
	phoneEditor,
	selectEditor,
	textEditor,
} from "@/components/bulk-upload-drawer.editors";
import { formatGender } from "@/lib/formatters/formatGender";
import type { Athlete } from "@/lib/trpc/types";
import { type CreateAthlete, GenderTypes } from "@/schemas";

const editorOptions = { commitOnOutsideClick: false } as const;

const genderEditor = selectEditor<Partial<CreateAthlete>>(
	[...GenderTypes],
	(option, row) =>
		formatGender({
			gender: option as Athlete["gender"],
			dateOfBirth: row.dateOfBirth ?? "",
		}),
);

export function useAthleteBulkColumns(): readonly Column<
	Partial<CreateAthlete>
>[] {
	return useMemo(
		() => [
			{
				key: "firstName",
				name: "First name",
				renderEditCell: textEditor,
				editable: true,
			},
			{
				key: "lastName",
				name: "Last name",
				renderEditCell: textEditor,
				editable: true,
			},
			{
				key: "nickname",
				name: "Preferred name",
				renderEditCell: textEditor,
				editable: true,
			},
			{
				key: "phone",
				name: "Phone",
				renderEditCell: phoneEditor,
				editable: true,
				editorOptions,
				renderCell: ({ row }) => row.phone ?? "",
			},
			{
				key: "gender",
				name: "Gender",
				renderEditCell: genderEditor,
				editable: true,
				renderCell: ({ row }) =>
					row.gender
						? formatGender({
								gender: row.gender as Athlete["gender"],
								dateOfBirth: row.dateOfBirth ?? "",
							})
						: "",
			},
			{
				key: "dateOfBirth",
				name: "Date of Birth",
				renderEditCell: dateEditor,
				editable: true,
				editorOptions,
				renderCell: ({ row }) => row.dateOfBirth ?? "",
			},
			{
				key: "dateJoined",
				name: "Date Joined",
				renderEditCell: dateEditor,
				editable: true,
				editorOptions,
				renderCell: ({ row }) => row.dateJoined ?? "",
			},
		],
		[],
	);
}
