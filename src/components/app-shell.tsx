import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Sparkles, LogOut, User as UserIcon, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const nav = [
  { to: "/", label: "Today" },
  { to: "/health", label: "Health" },
  { to: "/scan", label: "Face Scan" },
  { to: "/routine", label: "Routine" },
  { to: "/products", label: "Products" },
  { to: "/tutorials", label: "Tutorials" },
  { to: "/progress", label: "Progress" },
  { to: "/assistant", label: "Assistant" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-primary/20 shadow-sm" style={{ backgroundColor: "oklch(0.452 0.062 18)" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3.5 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-lg leading-none text-primary-foreground tracking-tight">
              360° Skincare
            </span>
          </Link>

          {/* Nav links */}
          <nav className="-mx-1 flex flex-1 items-center gap-0.5 overflow-x-auto">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="shrink-0 rounded-full px-3 py-1.5 text-sm transition-all duration-200"
                style={{ color: "oklch(0.97 0.015 85 / 0.75)" }}
                inactiveProps={{
                  style: { color: "oklch(0.97 0.015 85 / 0.75)" },
                  onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "oklch(0.97 0.015 85)";
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "oklch(0.452 0.062 18 / 0.35)";
                  },
                  onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "oklch(0.97 0.015 85 / 0.75)";
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                  },
                }}
                activeProps={{
                  style: {
                    backgroundColor: "oklch(0.82 0.09 355)",
                    color: "oklch(0.282 0.028 15)",
                    fontWeight: "600",
                  },
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          {isAuthenticated && user && (
            <div className="ml-auto pl-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                    <Avatar className="size-8 border-2 border-accent/60">
                      <AvatarFallback className="bg-accent text-accent-foreground font-display text-xs font-semibold">
                        {user.profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 rounded-2xl shadow-lift border-border bg-card">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{user.profile.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-accent/20 focus:bg-accent/20">
                    <Link to="/profile" className="flex w-full items-center">
                      <UserIcon className="mr-2 size-4 text-primary" />
                      <span>Edit Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-accent/20 focus:bg-accent/20">
                    <Link to="/settings" className="flex w-full items-center">
                      <Settings className="mr-2 size-4 text-primary" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-xl cursor-pointer"
                  >
                    <LogOut className="mr-2 size-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-20 sm:px-6">{children}</main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: "oklch(0.282 0.028 15)" }} className="border-t border-foreground/10">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Sparkles className="size-3.5" />
            </span>
            <span className="font-display text-sm text-primary-foreground/90 leading-none">360° Skincare</span>
          </div>
          {/* Accent bar */}
          <div className="hidden sm:flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-accent/70 inline-block" />
            <span className="size-1.5 rounded-full bg-accent/40 inline-block" />
            <span className="size-1.5 rounded-full bg-accent/20 inline-block" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl sm:text-4xl text-foreground">{title}</h1>
        {description ? (
          <p className="mt-3 text-muted-foreground leading-relaxed">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
