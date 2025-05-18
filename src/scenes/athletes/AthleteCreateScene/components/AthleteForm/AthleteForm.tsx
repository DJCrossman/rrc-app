'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatProgram } from '@/lib/formatters/formatProgram';
import { CreateAthlete, ProgramType, createAthleteSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';

interface AthleteFormProps {
  onSubmit: SubmitHandler<CreateAthlete>;
  onCancel?: (() => void) | string;
}

export function AthleteForm({
  onSubmit,
  onCancel: cancelLinkOrAction,
}: AthleteFormProps) {
  const form = useForm<CreateAthlete>({
    resolver: zodResolver(createAthleteSchema),
    defaultValues: {
      name: '',
      program: 'masters',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Athlete Name" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="program"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {ProgramType.map((program) => (
                      <SelectItem key={program} value={program}>
                        {formatProgram(program)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              onClick={() => cancelLinkOrAction()}
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
