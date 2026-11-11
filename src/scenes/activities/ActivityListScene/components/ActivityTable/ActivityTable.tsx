"use client";

import { IconBrandStrava, IconPlus } from "@tabler/icons-react";
import { keepPreviousData } from "@tanstack/react-query";
import {
	getCoreRowModel,
	type PaginationState,
	useReactTable,
} from "@tanstack/react-table";
import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import { useCurrentUser } from "@/hooks/useAuth";
import { formatDurationAsTime } from "@/lib/formatters/formatDuration";
import { formatMeters } from "@/lib/formatters/formatMeters";
import { formatCompactSplit } from "@/lib/formatters/formatSplit";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { ActivitiesResult, Activity, Athletes } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { FilterChip } from "@/scenes/schedule/ScheduleScene/components";
import { ActivityType } from "@/schemas";
import { SyncMenu } from "./SyncMenu";

const DEFAULT_PAGE_SIZE = 20;
const activityTypeOptions = ["all", ...ActivityType] as const;

interface ActivityTableProps {
	initialData: ActivitiesResult;
	athletes?: Athletes;
	athleteIds?: string[];
}

export function ActivityTable({
	initialData,
	athletes,
	athleteIds,
}: ActivityTableProps) {
	const router = useRouter();
	const { user, isAdmin } = useCurrentUser();
	const hasIntegration = user.stravaConnected || user.concept2Connected;

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});
	const [type, setType] = useState<(typeof ActivityType)[number] | undefined>(
		undefined,
	);

	const { data } = trpcClient.activities.getActivities.useQuery(
		{
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			type,
			athleteIds,
		},
		{ initialData, placeholderData: keepPreviousData },
	);

	const memberOptions: Option[] = useMemo(
		() =>
			(athletes ?? [])
				.map((athlete) => ({
					value: athlete.id,
					label: `${athlete.firstName} ${athlete.lastName}`,
				}))
				.sort((a, b) => a.label.localeCompare(b.label)),
		[athletes],
	);
	const selectedMemberOptions = useMemo(
		() => memberOptions.filter((option) => athleteIds?.includes(option.value)),
		[memberOptions, athleteIds],
	);

	const table = useReactTable({
		data: data.data,
		columns: [],
		state: { pagination },
		manualPagination: true,
		pageCount: data.totalPages,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
	});

	const now = DateTime.now();
	const activitiesByDay = new Map<string, Activity[]>();
	for (const activity of data.data) {
		const day =
			DateTime.fromISO(activity.startDate).toISODate() ?? activity.startDate;
		activitiesByDay.set(day, [...(activitiesByDay.get(day) ?? []), activity]);
	}

	return (
		<div className="w-full flex-col justify-start gap-6">
			<div className="flex flex-col gap-3 px-4 pb-3 md:flex-row md:items-center md:justify-between md:p-4 lg:px-6">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
					<div className="flex shrink-0 gap-2 overflow-x-auto">
						{activityTypeOptions.map((option) => (
							<FilterChip
								key={option}
								isActive={(type ?? "all") === option}
								onClick={() => {
									setType(
										ActivityType.find(
											(activityType) => activityType === option,
										),
									);
									setPagination((prev) => ({ ...prev, pageIndex: 0 }));
								}}
							>
								{option === "all"
									? "All"
									: option === "water"
										? "Water"
										: "Erg"}
							</FilterChip>
						))}
					</div>
					{isAdmin && (
						<>
							<Label htmlFor="member-selector" className="sr-only">
								Members
							</Label>
							<MultiSelect
								className="min-w-[240px]"
								placeholder="All members"
								inputProps={{ id: "member-selector" }}
								options={memberOptions}
								value={selectedMemberOptions}
								onChange={(options) => {
									router.replace(
										options.length
											? `${routes.activities.list()}?athleteIds=${options.map((option) => option.value).join(",")}`
											: routes.activities.list(),
									);
									setPagination((prev) => ({ ...prev, pageIndex: 0 }));
								}}
							/>
						</>
					)}
				</div>
				<div className="flex items-center max-md:hidden">
					<Button
						variant="outline"
						size="sm"
						className={hasIntegration ? "rounded-r-none" : undefined}
						render={
							<Link
								href={`${routes.activities.create()}${athleteIds?.length ? `&athleteIds=${athleteIds.join(",")}` : ""}`}
							/>
						}
					>
						<IconPlus />
						<span className="hidden lg:inline">Add Activity</span>
					</Button>
					<SyncMenu />
				</div>
			</div>
			<div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
				<ul className="flex flex-col gap-4 md:gap-3">
					{data.data.length === 0 && (
						<li className="p-4 text-center text-sm text-muted-foreground">
							No results.
						</li>
					)}
					{[...activitiesByDay].map(([day, activities]) => {
						const date = DateTime.fromISO(day);
						return (
							<li key={day} className="flex flex-col gap-2 md:gap-1.5">
								<h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
									{date.hasSame(now, "day")
										? "Today"
										: date.hasSame(now.minus({ days: 1 }), "day")
											? "Yesterday"
											: date.toFormat("ccc LLL d")}
								</h2>
								<ul className="flex flex-col gap-2 md:gap-1.5">
									{activities.map((activity) => (
										<li key={activity.id}>
											<Link
												href={`${routes.activities.view(activity.id)}${athleteIds?.length ? `&athleteIds=${athleteIds.join(",")}` : ""}`}
												className="flex items-center gap-3 rounded-xl border bg-card p-3.5 text-card-foreground hover:bg-muted md:rounded-lg md:px-3 md:py-2"
											>
												<span
													className={cn(
														"flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold md:size-8 md:rounded-lg md:text-[10px]",
														activity.type === "water"
															? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
															: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
													)}
												>
													{activity.type === "water" ? "H2O" : "ERG"}
												</span>
												<span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
													<span className="max-w-full truncate text-[15px] font-semibold max-md:basis-full md:text-sm">
														{activity.name}
													</span>
													{activity.type === "erg" &&
														activity.conceptTwoData && (
															<Badge
																variant="outline"
																className="shrink-0 max-md:hidden"
															>
																Concept2
															</Badge>
														)}
													{activity.isStrava && (
														<Badge
															variant="outline"
															className="shrink-0 max-md:hidden"
														>
															Strava
														</Badge>
													)}
													<span className="basis-full truncate text-[13px] text-muted-foreground md:text-xs">
														{isAdmin && (
															<span className="max-md:hidden">
																{activity.athlete.firstName}{" "}
																{activity.athlete.lastName} ·{" "}
															</span>
														)}
														{[
															activity.type === "water" ? "Water" : "Erg",
															activity.type === "water" && activity.boat?.name,
															activity.distance > 0 &&
																`${formatCompactSplit(activity.elapsedTime, activity.distance)} /500m`,
															activity.type === "erg" &&
																typeof activity.conceptTwoData?.stroke_rate ===
																	"number" &&
																`${Math.round(activity.conceptTwoData.stroke_rate)} spm`,
														]
															.filter(Boolean)
															.join(" · ")}
													</span>
													{isAdmin && (
														<span className="min-w-0 truncate text-[13px] text-muted-foreground md:hidden">
															{activity.athlete.firstName}{" "}
															{activity.athlete.lastName}
														</span>
													)}
													{activity.type === "erg" &&
														activity.conceptTwoData && (
															<span
																title="Concept2"
																className="shrink-0 text-[11px] leading-none font-bold text-muted-foreground md:hidden"
															>
																C2
															</span>
														)}
													{activity.isStrava && (
														<IconBrandStrava
															role="img"
															aria-label="Strava"
															className="size-4 shrink-0 text-muted-foreground md:hidden"
														/>
													)}
												</span>
												<span className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
													<span className="text-[15px] font-semibold whitespace-nowrap md:text-sm">
														{formatMeters(activity.distance)}
													</span>
													<span className="text-xs text-muted-foreground">
														{formatDurationAsTime(activity.elapsedTime)}
													</span>
												</span>
											</Link>
										</li>
									))}
								</ul>
							</li>
						);
					})}
				</ul>
				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						{data.totalCount}{" "}
						{data.totalCount === 1 ? "activity" : "activities"}
					</div>
					<DataTablePagination table={table} />
				</div>
			</div>
		</div>
	);
}
