"use client";

import { Search, Bell } from "lucide-react";
import { Avatar } from "./avatar";

interface TopNavbarProps {
  userName?: string;
  userAvatar?: string;
  onSearch?: (query: string) => void;
}

export function TopNavbar({ userName, userAvatar, onSearch }: TopNavbarProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-border">
      <div className="flex items-center justify-between h-16 pl-14 pr-5 md:px-8 lg:px-10">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar..."
            onChange={e => onSearch?.(e.target.value)}
            className="h-9 w-full rounded-lg bg-muted pl-9 pr-12 text-sm placeholder:text-muted-foreground border border-transparent focus-visible:outline-none focus-visible:border-ring focus-visible:bg-background transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
              3
            </span>
          </button>
          <Avatar name={userName || "Usuario"} src={userAvatar} size="sm" />
          <span className="text-sm font-medium text-foreground max-md:hidden">{userName}</span>
        </div>
      </div>
    </div>
  );
}
