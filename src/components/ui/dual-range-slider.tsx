'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface DualRangeSliderProps extends SliderPrimitive.Root.Props<number[]> {
  labelPosition?: 'top' | 'bottom';
  label?: (value: number | undefined) => React.ReactNode;
}

const DualRangeSlider = React.forwardRef<
  HTMLDivElement,
  DualRangeSliderProps
>(({ className, label, labelPosition = 'top', ...props }, ref) => {
  const initialValue = Array.isArray(props.value)
    ? props.value
    : [props.min, props.max];

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('w-full pb-4', className)}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none select-none items-center">
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Indicator className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {initialValue.map((value, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <React.Fragment key={index}>
            <SliderPrimitive.Thumb
              index={index}
              className="relative block h-4 w-4 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {label && (
                <span
                  className={cn(
                    'absolute flex whitespace-nowrap justify-center',
                    labelPosition === 'top' && '-top-7',
                    labelPosition === 'bottom' && 'top-4',
                  )}
                >
                  {label(value)}
                </span>
              )}
            </SliderPrimitive.Thumb>
          </React.Fragment>
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
});
DualRangeSlider.displayName = 'DualRangeSlider';

export { DualRangeSlider };
