import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('relative w-full rounded-lg border p-4 text-sm flex gap-3 items-start', {
  variants: {
    variant: {
      default: 'border-[var(--color-success)] bg-green-50 text-[var(--color-success)]',
      destructive: 'border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]',
      info: 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]',
    },
  },
  defaultVariants: { variant: 'info' },
});

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn('mb-1 font-medium leading-none', className)} {...props} />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
