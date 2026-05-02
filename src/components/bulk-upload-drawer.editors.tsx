import type { RenderEditCellProps } from "react-data-grid";
import { PhoneInputControlled } from "@/components/phone-input";
import { DateInput } from "@/components/ui/date-input";

const editorClass =
	"w-full h-full px-2 outline-none border-0 bg-transparent text-sm";

// React-data-grid commits row changes via flushSync. If an editor's onBlur
// fires while React is mid-render (e.g. a Popover/portal mount shifting focus),
// flushSync throws. Deferring close out of the current render avoids that.
const deferClose = (close: () => void) => queueMicrotask(close);

export function textEditor<TRow>({
	row,
	column,
	onRowChange,
	onClose,
}: RenderEditCellProps<TRow>) {
	const value = (row as Record<string, unknown>)[column.key] as
		| string
		| undefined;
	return (
		<input
			type="text"
			className={editorClass}
			value={value ?? ""}
			onChange={(e) =>
				onRowChange({ ...row, [column.key]: e.target.value || undefined })
			}
			onBlur={() => deferClose(() => onClose(true, false))}
		/>
	);
}

export function phoneEditor<TRow>({
	row,
	column,
	onRowChange,
	onClose,
}: RenderEditCellProps<TRow>) {
	const value = (row as Record<string, unknown>)[column.key] as
		| string
		| undefined;
	return (
		<PhoneInputControlled
			defaultCountry="CA"
			value={(value || undefined) as never}
			onChange={(newValue) =>
				onRowChange({ ...row, [column.key]: newValue || undefined })
			}
			onBlur={() => deferClose(() => onClose(true, false))}
			className="h-full w-full px-1"
		/>
	);
}

export function dateEditor<TRow>({
	row,
	column,
	onRowChange,
}: RenderEditCellProps<TRow>) {
	const value = (row as Record<string, unknown>)[column.key] as
		| string
		| undefined;
	// Picking a date should commit + close in one call (commitChanges=true) so
	// the staged change can't be discarded between updates and close. Escape/
	// Enter are still handled natively by react-data-grid. No onBlur close —
	// blur fires when the calendar popover takes focus, and closing the editor
	// would unmount the popover before it's visible.
	return (
		<DateInput
			value={value ?? ""}
			onChange={(e) => {
				const next = e.target.value || undefined;
				onRowChange({ ...row, [column.key]: next }, true);
			}}
			className="h-full w-full border-0"
		/>
	);
}

/**
 * Factory for select-based cell editors. Pass the option list and an optional
 * label-resolver that can read the current row (e.g. to format gender based
 * on dateOfBirth).
 */
export function selectEditor<TRow>(
	options: readonly string[],
	getLabel?: (option: string, row: TRow) => string,
) {
	return function SelectEditor({
		row,
		column,
		onRowChange,
	}: RenderEditCellProps<TRow>) {
		const value = (row as Record<string, unknown>)[column.key] as
			| string
			| undefined;
		return (
			<select
				className={editorClass}
				value={value ?? ""}
				onChange={(e) => {
					const next = e.target.value || undefined;
					onRowChange({ ...row, [column.key]: next }, true);
				}}
			>
				<option value="">—</option>
				{options.map((option) => (
					<option key={option} value={option}>
						{getLabel ? getLabel(option, row) : option}
					</option>
				))}
			</select>
		);
	};
}
