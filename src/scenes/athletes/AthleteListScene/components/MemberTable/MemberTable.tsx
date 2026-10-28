"use client";

import {
	IconCaretDown,
	IconCaretUp,
	IconChevronDown,
	IconCircleCheck,
	IconMailPlus,
	IconPlus,
	IconSearch,
} from "@tabler/icons-react";
import { keepPreviousData } from "@tanstack/react-query";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { DateTime } from "luxon";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	MultiSelect,
	type Option,
	useDebounce,
} from "@/components/ui/multi-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Member, MembersResult } from "@/lib/trpc/types";
import { InviteMemberDialog } from "../InviteMemberDialog/InviteMemberDialog";
import { useMemberInvites } from "../useMemberInvites";
import { MemberRowActions } from "./MemberRowActions";

const DEFAULT_PAGE_SIZE = 20;
const sortColumns = ["name", "dateJoined"] as const;
const activeMembershipOptions = ["all", "true", "false"] as const;

const columns: ColumnDef<Member>[] = [
	{
		accessorKey: "name",
		header: () => <div className="lg:w-72">Name</div>,
		cell: ({ row }) => {
			const member = row.original;
			const accountLabel = getAccountLabel(member);
			return (
				<div className="flex flex-wrap items-center gap-1.5">
					{member.athleteId ? (
						<Link href={routes.members.view(member.athleteId)}>
							{member.name}
						</Link>
					) : (
						<span>{member.name}</span>
					)}
					{member.isAdmin && (
						<Badge variant="secondary" className="px-1.5">
							Admin
						</Badge>
					)}
					{accountLabel && (
						<Badge variant="outline" className="text-muted-foreground px-1.5">
							{accountLabel}
						</Badge>
					)}
				</div>
			);
		},
		enableHiding: false,
		enableSorting: true,
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => (
			<span className="text-muted-foreground">{row.original.email}</span>
		),
		enableSorting: false,
	},
	{
		id: "active",
		header: "Active",
		cell: ({ row }) =>
			row.original.athlete?.activeMembership ? (
				<IconCircleCheck size={16} className="text-green-500" />
			) : null,
		enableSorting: false,
	},
	{
		id: "program",
		header: "Program",
		cell: ({ row }) => {
			const membership = row.original.athlete?.activeMembership;
			if (!membership) return null;
			return (
				<Badge variant="outline" className="text-muted-foreground px-1.5">
					{membership.name}
				</Badge>
			);
		},
		enableSorting: false,
	},
	{
		id: "groups",
		header: "Groups",
		cell: ({ row }) => {
			const groups = row.original.athlete?.groups ?? [];
			if (groups.length === 0) return null;
			return (
				<div className="flex flex-wrap gap-1">
					{groups.map((group) => (
						<Badge
							key={group.id}
							variant="outline"
							className="text-muted-foreground px-1.5"
							render={<Link href={routes.groups.view(group.id)} />}
						>
							{group.name}
						</Badge>
					))}
				</div>
			);
		},
		enableSorting: false,
	},
	{
		id: "dateJoined",
		header: "Date Joined",
		cell: ({ row }) => {
			const dateJoined = row.original.athlete?.dateJoined;
			return (
				dateJoined &&
				DateTime.fromISO(dateJoined).toLocaleString({
					month: "short",
					year: "numeric",
				})
			);
		},
		enableSorting: true,
	},
	{
		id: "actions",
		header: () => <span className="sr-only">Actions</span>,
		cell: ({ row }) => <MemberRowActions member={row.original} />,
		enableSorting: false,
	},
];

interface IMemberTableProps {
	initialData: MembersResult;
}

export function MemberTable({ initialData }: IMemberTableProps) {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});
	const [sorting, setSorting] = useState<SortingState>([]);
	const [programIds, setProgramIds] = useState<string[]>([]);
	const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
	const [search, setSearch] = useState("");
	const [isInviteOpen, setIsInviteOpen] = useState(false);
	const debouncedSearch = useDebounce(search.trim(), 300);
	const { isAdmin } = useCurrentUser();
	const utils = trpcClient.useUtils();
	const { invite } = useMemberInvites();

	const sort = sorting[0];
	const { data } = trpcClient.members.getMembers.useQuery(
		{
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			sortBy: sortColumns.find((column) => column === sort?.id),
			order: sort ? (sort.desc ? "desc" : "asc") : undefined,
			programIds: programIds.length ? programIds : undefined,
			isActive,
			search: debouncedSearch || undefined,
		},
		{ initialData, placeholderData: keepPreviousData },
	);
	const syncRca = trpcClient.activities.syncRca.useMutation({
		onSuccess: async (result) => {
			toast.success("Synced from RCA", {
				description: `${result.programs.upserted} programs · ${result.memberships.upserted} memberships`,
			});
			await utils.members.getMembers.invalidate();
		},
		onError: (error) => toast.error(error.message),
	});

	const programsQuery = trpcClient.programs.getPrograms.useQuery();
	const programOptions: Option[] = useMemo(
		() =>
			(programsQuery.data?.data ?? []).map((p) => ({
				value: p.id,
				label: p.name,
			})),
		[programsQuery.data],
	);
	const selectedProgramOptions = useMemo(
		() => programOptions.filter((o) => programIds.includes(o.value)),
		[programOptions, programIds],
	);

	const table = useReactTable({
		data: data.data,
		columns,
		state: { pagination, sorting },
		getRowId: (row) => row.id,
		manualPagination: true,
		manualSorting: true,
		pageCount: data.totalPages,
		rowCount: data.totalCount,
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="w-full flex-col justify-start gap-6">
			<div className="flex items-center justify-between p-4 lg:px-6">
				<div className="flex items-center gap-2">
					<div className="relative">
						<IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							aria-label="Search members"
							placeholder="Search members"
							className="h-8 w-56 pl-8"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPagination((prev) => ({ ...prev, pageIndex: 0 }));
							}}
						/>
					</div>
					<Label htmlFor="program-selector" className="sr-only">
						Programs
					</Label>
					<MultiSelect
						className="min-w-[240px]"
						placeholder="All Programs"
						options={programOptions}
						value={selectedProgramOptions}
						onChange={(opts) => {
							setProgramIds(opts.map((o) => o.value));
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
					/>
					<Label htmlFor="active-membership-selector" className="sr-only">
						Active Membership
					</Label>
					<Select
						items={activeMembershipOptions.map((membership) => ({
							value: membership,
							label:
								membership === "all"
									? "Active & Inactive"
									: membership === "true"
										? "Active"
										: "Inactive",
						}))}
						value={isActive === undefined ? "all" : isActive ? "true" : "false"}
						onValueChange={(value) => {
							setIsActive(value === "all" ? undefined : value === "true");
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
					>
						<SelectTrigger
							className="flex w-fit"
							size="sm"
							id="active-membership-selector"
						>
							<SelectValue placeholder="Select a program" />
						</SelectTrigger>
						<SelectContent>
							{activeMembershipOptions.map((membership) => (
								<SelectItem key={membership} value={membership}>
									{membership === "all"
										? "Active & Inactive"
										: membership === "true"
											? "Active"
											: "Inactive"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-2">
					{isAdmin && (
						<Button size="sm" onClick={() => setIsInviteOpen(true)}>
							<IconMailPlus />
							<span className="hidden lg:inline">Invite member</span>
						</Button>
					)}
					<div className="flex items-center">
						<Button
							variant="outline"
							size="sm"
							className="rounded-r-none"
							render={<Link href={routes.members.create()} />}
						>
							<IconPlus />
							<span className="hidden lg:inline">Add Member</span>
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										variant="outline"
										size="sm"
										className="rounded-l-none border-l-0 px-2"
										aria-label="More add options"
									/>
								}
							>
								<IconChevronDown />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									render={<Link href={routes.members.bulkCreate()} />}
								>
									Bulk Add Members
								</DropdownMenuItem>
								{isAdmin && (
									<DropdownMenuItem
										disabled={syncRca.isPending}
										onClick={() => syncRca.mutate()}
									>
										Sync from RCA
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
			<div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
				<div className="overflow-hidden rounded-lg border">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead
												key={header.id}
												colSpan={header.colSpan}
												onClick={header.column.getToggleSortingHandler()}
											>
												<div className="flex items-center gap-2">
													{header.isPlaceholder
														? null
														: flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
													{{
														asc: <IconCaretUp />,
														desc: <IconCaretDown />,
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody className="**:data-[slot=table-cell]:first:w-8">
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						{data.totalCount} {data.totalCount === 1 ? "member" : "members"}.
					</div>
					<DataTablePagination table={table} />
				</div>
			</div>
			<InviteMemberDialog
				isOpen={isInviteOpen}
				onClose={() => setIsInviteOpen(false)}
				onSubmit={async (data) => {
					const { sent } = await invite.mutateAsync(data);
					if (sent.length > 0) setIsInviteOpen(false);
				}}
			/>
		</div>
	);
}

function getAccountLabel(member: Member): string | null {
	if (member.account === "invited") return "Invited";
	if (member.account === "none") return "No account";
	if (!member.athlete) return "No profile yet";
	return null;
}
