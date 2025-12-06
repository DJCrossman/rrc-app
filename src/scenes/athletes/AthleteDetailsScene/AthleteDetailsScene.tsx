"use client";

import { IconPencil } from "@tabler/icons-react";
import { DateTime } from "luxon";
import type React from "react";
import { useState } from "react";
import { ActivityTable } from "@/components/activities";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { formatProgram, formatRole } from "@/lib/formatters";
import { formatGender } from "@/lib/formatters/formatGender";
import { routes } from "@/lib/routes";
import type { Activities, Athlete } from "@/schemas";
import { AthleteForm } from "../AthleteCreateScene/components/AthleteForm/AthleteForm";

interface AthleteDetailsSceneProps {
	athlete: Athlete;
	activities: Activities;
	onSubmit: (data: Athlete) => void;
}

export const AthleteDetailsScene = ({
	athlete,
	activities,
	onSubmit: handleSubmit,
}: AthleteDetailsSceneProps) => {
	const [isEditing, setIsEditing] = useState(false);
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader
					breadcrumbs={[
						{ label: "Athletes", href: routes.athletes.list() },
						{ label: athlete.name },
					]}
				/>

				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
							<div className="w-full md:w-2/3 p-4">
								<div className="flex justify-between items-center flex-col md:flex-row mb-4">
									<h1 className="text-2xl font-bold">{athlete.name}</h1>
									{!isEditing && (
										<div>
											<Button
												variant="link"
												onClick={() => {
													setIsEditing(!isEditing);
												}}
											>
												<IconPencil size={16} />
												Edit
											</Button>
										</div>
									)}
								</div>
								{!isEditing && (
									<div className="space-y-4">
										<div className="flex flex-col md:flex-row gap-4">
											<p className="flex-1">
												<strong>Phone:</strong>{" "}
												<a href={`tel:${athlete.phone}`}>{athlete.phone}</a>
											</p>
											<p className="flex-1">
												<strong>Roles:</strong>{" "}
												{athlete.roles.map((role) => (
													<Badge key={role} variant="outline" className="mr-2">
														{formatRole(role)}
													</Badge>
												))}
											</p>
										</div>
										<div className="flex flex-col md:flex-row gap-4">
											<p className="flex-1">
												<strong>Age:</strong>{" "}
												{Math.floor(
													DateTime.now()
														.diff(
															DateTime.fromISO(athlete.dateOfBirth),
															"years",
														)
														.toObject().years || 0,
												)}
											</p>
											<p className="flex-1">
												<strong>Gender:</strong> {formatGender(athlete)}
											</p>
										</div>
										<div className="flex flex-col md:flex-row gap-4">
											<p className="flex-1">
												<strong>Active Membership:</strong>
												<br /> {athlete?.activeMembership?.name || "None"}
												{athlete.programType && (
													<Badge variant="outline" className="ml-2">
														{formatProgram(athlete.programType)}
													</Badge>
												)}
											</p>
											<p className="flex-1">
												<strong>Joined:</strong>
												<br />{" "}
												{!athlete.dateJoined
													? "N/A"
													: DateTime.fromISO(athlete.dateJoined).toLocaleString(
															DateTime.DATE_FULL,
														)}
											</p>
										</div>
									</div>
								)}
								{!!isEditing && (
									<AthleteForm
										initialValues={athlete}
										onCancel={() => setIsEditing(false)}
										onSubmit={async (value) => {
											await handleSubmit({
												...athlete,
												...value,
											});
											setIsEditing(false);
										}}
									/>
								)}
							</div>
						</div>
						<hr className="mx-auto w-[80%]" />
						<div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
							<div className="w-full md:w-2/3 p-4">
								<ActivityTable
									data={activities}
									showColumns={[
										"startDate",
										"name",
										"boat.name",
										"isStrava",
										"distance",
									]}
								/>
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};
