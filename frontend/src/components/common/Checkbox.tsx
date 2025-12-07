import { type InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={`w-4 h-4 text-accent-primary bg-background border-border rounded focus:ring-accent-primary accent-accent-primary cursor-pointer transition-colors ${className}`}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";
