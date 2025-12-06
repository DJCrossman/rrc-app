'use client';

import * as React from 'react';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DateTime } from 'luxon';
import { Input } from './input';

const userAgent = navigator.userAgent;
const hasNativeSupport =
  /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(userAgent) ||
  /\b(Android|Windows Phone|iPad|iPod)\b/i.test(userAgent) ||
  /\b(Version\/((14.[1-9].[0-9])|(14.[1-9])|(1[5-9].[0-9])|([2-9][0-9].[0-9])|([0-9][0-9][0-9].[0-9]))( Mobile\/15E148 | )Safari)\b/i.test(
    userAgent,
  );
const isSafari =
  /\b(Version\/(([0-9][0-9].[0-9].[0-9])|([0-9][0-9].[0-9])|([0-9][0-9][0-9].[0-9]))( Mobile\/15E148 | )Safari)\b/i.test(
    userAgent,
  );

type PartialChangeEvent = {
  target: {
    value: React.ChangeEvent<HTMLInputElement>['target']['value'];
    name?: string;
  };
};

interface DateInputProps
  extends Omit<
    React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >,
    'value' | 'onChange'
  > {
  value?: string;
  onChange?: (e: PartialChangeEvent) => void;
}

export const DateInput = ({ value, onChange, ...props }: DateInputProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Input
        {...props}
        type="date"
        className={cn(
          isSafari ? 'safari-date' : '',
          !hasNativeSupport ? 'unsupported-date' : '',
          props.className,
        )}
        value={value ?? ''}
        onChange={onChange}
      />
    </PopoverTrigger>
    {!hasNativeSupport && (
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={value ? DateTime.fromISO(value).toJSDate() : undefined}
          defaultMonth={value ? DateTime.fromISO(value).toJSDate() : undefined}
          onSelect={(date?: Date) =>
            onChange?.({
              target: {
                value: date
                  ? (DateTime.fromJSDate(date).toISODate() ?? '')
                  : '',
                name: props.name,
              },
            })
          }
          initialFocus
          required={props.required}
        />
      </PopoverContent>
    )}
  </Popover>
);
