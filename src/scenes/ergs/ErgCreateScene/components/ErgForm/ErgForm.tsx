"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { type SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type CreateErg, createErgSchema } from "@/schemas";

interface ErgFormProps {
	onSubmit: SubmitHandler<CreateErg>;
	onCancel?: (() => void) | string;
	defaultValues?: Partial<CreateErg>;
}

export function ErgForm({
	onSubmit,
	onCancel: cancelLinkOrAction,
	defaultValues,
}: ErgFormProps) {
	const form = useForm<CreateErg>({
		resolver: zodResolver(createErgSchema),
		defaultValues: defaultValues || {
			name: "",
			manufacturer: "concept2",
			firmwareVersion: "",
			hardwareVersion: "",
			serialNumber: "",
			dataCode: "",
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Erg Name</FormLabel>
							<FormControl>
								<Input placeholder="Enter erg name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="manufacturer"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Manufacturer</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select manufacturer" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="concept2">Concept2</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="serialNumber"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Serial Number (Optional)</FormLabel>
							<FormControl>
								<Input placeholder="Enter serial number" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="firmwareVersion"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Firmware Version (Optional)</FormLabel>
							<FormControl>
								<Input placeholder="e.g., 6.15.0" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="hardwareVersion"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Hardware Version (Optional)</FormLabel>
							<FormControl>
								<Input placeholder="e.g., PM5" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="dataCode"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Data Code (Optional)</FormLabel>
							<FormControl>
								<Input placeholder="Enter data code" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex gap-4">
					<Button type="submit" className="flex-1">
						Create Erg
					</Button>
					{cancelLinkOrAction && (
						<Button variant="outline" className="flex-1" asChild>
							{typeof cancelLinkOrAction === "string" ? (
								<Link href={cancelLinkOrAction}>Cancel</Link>
							) : (
								<button type="button" onClick={cancelLinkOrAction}>
									Cancel
								</button>
							)}
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
}
