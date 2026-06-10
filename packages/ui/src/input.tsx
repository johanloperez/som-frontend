import { cn } from "./cn";

const AUTOCOMPLETE_MAP: Record<string, string> = {
  email: "email",
  password: "current-password",
  fullName: "name",
  displayName: "organization",
  legalName: "organization",
  adminEmail: "email",
  adminFullName: "name",
  phoneE164: "tel",
  country: "country",
  city: "address-level2",
  postalCode: "postal-code",
  streetLine1: "street-address",
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  tooltip?: string;
}

export function Input({ className, label, error, tooltip, id, autoComplete, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium" title={tooltip}>
          {label}
        </label>
      )}
      <input
        id={id}
        autoComplete={autoComplete ?? (id ? AUTOCOMPLETE_MAP[id] ?? "off" : "off")}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
