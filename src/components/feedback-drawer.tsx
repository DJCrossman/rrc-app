"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerCloseButton,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	closeFeedback,
	type FeedbackRequest,
	getFeedbackState,
	subscribeToFeedback,
} from "@/lib/feedback";
import { trpcClient } from "@/lib/trpc/client";
import {
	type FeedbackForm as FeedbackFormValues,
	type FeedbackType,
	FeedbackTypes,
	feedbackFormSchema,
} from "@/schemas";

export const FeedbackDrawer = () => {
	const { open, request } = useSyncExternalStore(
		subscribeToFeedback,
		getFeedbackState,
		getFeedbackState,
	);

	return (
		<Drawer
			open={open}
			onOpenChange={(next) => !next && closeFeedback()}
			direction="right"
		>
			<DrawerContent>
				<DrawerHeader className="flex flex-row items-center justify-between border-b">
					<div>
						<DrawerTitle>
							{request?.error ? "Report a problem" : "Send feedback"}
						</DrawerTitle>
						<DrawerDescription>
							Posted as a public GitHub issue, without your name.
						</DrawerDescription>
					</div>
					<DrawerCloseButton />
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6">
					{request && <FeedbackForm key={request.id} request={request} />}
				</div>
			</DrawerContent>
		</Drawer>
	);
};

const TYPE_LABELS: Record<FeedbackType, string> = {
	bug: "Bug",
	idea: "Idea",
	question: "Question",
};

const FeedbackForm = ({ request }: { request: FeedbackRequest }) => {
	const submit = trpcClient.feedback.submit.useMutation();
	const form = useForm<FeedbackFormValues>({
		resolver: zodResolver(feedbackFormSchema),
		defaultValues: {
			type: request.error ? "bug" : "idea",
			title: request.error ? `Error on ${request.pagePath}` : "",
			description: "",
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((values) =>
					submit.mutate(
						{
							...values,
							pagePath: request.pagePath,
							userAgent: navigator.userAgent,
							error: request.error,
						},
						{
							onSuccess: (issue) => {
								toast.success("Thanks for the feedback", {
									description: `Filed as issue #${issue.number}`,
									action: {
										label: "View",
										onClick: () =>
											window.open(issue.url, "_blank", "noopener,noreferrer"),
									},
								});
								closeFeedback();
							},
							onError: (error) => toast.error(error.message),
						},
					),
				)}
				className="space-y-6"
			>
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Type</FormLabel>
							<FormControl>
								<ToggleGroup
									variant="outline"
									value={[field.value]}
									onValueChange={(values) => {
										const value = values[0];
										if (value) field.onChange(value);
									}}
									className="w-full"
								>
									{FeedbackTypes.map((type) => (
										<ToggleGroupItem key={type} value={type}>
											{TYPE_LABELS[type]}
										</ToggleGroupItem>
									))}
								</ToggleGroup>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel isRequired>Summary</FormLabel>
							<FormControl>
								<Input
									placeholder="One line about what's up"
									autoFocus={!request.error}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Details</FormLabel>
							<FormControl>
								<Textarea
									className="min-h-32"
									placeholder={
										request.error
											? "What were you doing when this happened?"
											: "Anything that helps us understand it"
									}
									autoFocus={!!request.error}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								We attach the page you're on and your browser. Don't include
								personal details.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				{request.error && (
					<div className="rounded-lg border bg-muted/50 p-3 text-sm">
						<p className="font-medium">Error details attached</p>
						<p className="mt-1 font-mono text-xs break-words text-muted-foreground">
							{request.error.message}
						</p>
					</div>
				)}
				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={closeFeedback}>
						Cancel
					</Button>
					<Button type="submit" disabled={submit.isPending}>
						{submit.isPending ? "Sending…" : "Send"}
					</Button>
				</div>
			</form>
		</Form>
	);
};
