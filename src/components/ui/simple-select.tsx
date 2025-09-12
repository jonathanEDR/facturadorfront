import * as React from 'react';
import { cn } from '@/lib/utils';

interface SimpleSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SimpleSelectOptionProps {
  value: string;
  children: React.ReactNode;
}

export function SimpleSelect({ value = '', onValueChange, children, className }: SimpleSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
    </select>
  );
}

export function SimpleSelectOption({ value, children }: SimpleSelectOptionProps) {
  return <option value={value}>{children}</option>;
}
