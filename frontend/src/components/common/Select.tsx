import { type SelectHTMLAttributes, forwardRef, type ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  options: SelectOption[];
  size?: "sm" | "md" | "lg";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, icon, options, size = "md", className = "", ...props }, ref) => {
    const sizeClasses = {
      sm: "px-2 py-1.5 text-xs",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`w-full bg-background border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-transparent transition-colors ${
              icon ? "pl-10 pr-4" : "px-3"
            } ${sizeClasses[size]} ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

