'use client';

import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreateWorkout, workoutCoreSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { DateTime } from 'luxon';
import { SubmitHandler, useForm } from 'react-hook-form';

interface WorkoutFormProps {
  onSubmit: SubmitHandler<CreateWorkout>;
  onCancel?: (() => void) | string;
}

export function WorkoutForm({
  onSubmit,
  onCancel: cancelLinkOrAction,
}: WorkoutFormProps) {
  const form = useForm<CreateWorkout>({
    resolver: zodResolver(workoutCoreSchema),
    defaultValues: {
      description: '',
      startDate: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Workout Description" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DateInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4">
          {typeof cancelLinkOrAction === 'string' && (
            <Button variant="outline" asChild>
              <a href={cancelLinkOrAction}>Cancel</a>
            </Button>
          )}
          {typeof cancelLinkOrAction === 'function' && (
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                cancelLinkOrAction();
              }}
            >
              Cancel
            </Button>
          )}
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}
