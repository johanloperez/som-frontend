import { cn } from "./cn";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#0891b2", "#4f46e5"];
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, src, size = "md", className }: {
  name: string; src?: string; size?: "sm" | "md" | "lg"; className?: string;
}) {
  const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-11 w-11 text-base" };
  if (src) return <img src={src} alt={name} className={cn("rounded-full object-cover", sizes[size], className)} />;
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", sizes[size], className)}
      style={{ backgroundColor: stringToColor(name) }}>
      {getInitials(name)}
    </div>
  );
}
