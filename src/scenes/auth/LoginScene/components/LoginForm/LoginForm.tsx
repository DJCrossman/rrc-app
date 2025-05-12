'use client';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import parsePhoneNumber from 'libphonenumber-js';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { PhoneInput } from '../../../../../components/phone-input';

const FormSchema = z.object({
  phoneNumber: z.string().transform((value, ctx) => {
    const phoneNumber = parsePhoneNumber(value, {
      defaultCountry: 'FI',
    });

    if (!phoneNumber?.isValid()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid phone number',
      });
      return z.NEVER;
    }

    return phoneNumber.formatInternational();
  }),
});

interface LoginFormProps {
  values: { phoneNumber?: string };
  onSubmit: SubmitHandler<z.infer<typeof FormSchema>>;
}

export function LoginForm({ values, onSubmit: handleSubmit }: LoginFormProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      phoneNumber: values.phoneNumber,
    },
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-2/3 space-y-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Sign in or sign up</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your phone below to login to your account
          </p>
        </div>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="phoneNumber">Phone</Label>
            <PhoneInput
              id="phoneNumber"
              name="phoneNumber"
              type="phone"
              placeholder="1 (306) 777-7777"
              control={form.control}
              required
              defaultCountry="CA"
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </div>
      </form>
    </Form>
  );
}
