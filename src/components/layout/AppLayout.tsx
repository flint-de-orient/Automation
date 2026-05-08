import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox as InboxIcon,
  Users,
  Settings as SettingsIcon,
  Bell,
  Search,
  LogOut,
  Menu,
  BookOpen,
  CalendarDays,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChannelIcon } from "@/components/ChannelIcon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads Box", icon: BookOpen },
  { to: "/inbox", label: "Unified Inbox", icon: InboxIcon },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/schedule-leads", label: "Schedule Leads", icon: CalendarDays },
];

const channelNav = [
  { to: "/inbox/whatsapp", label: "WhatsApp", channel: "whatsapp" as const, count: 3 },
  { to: "/inbox/facebook", label: "Facebook", channel: "facebook" as const, count: 1 },
  { to: "/inbox/instagram", label: "Instagram", channel: "instagram" as const, count: 3 },
  { to: "/inbox/email", label: "Email", channel: "email" as const, count: 0 },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "", email: "", avatarColor: "from-violet-400 to-fuchsia-500" });

  const fetchProfile = () => {
    fetch("http://localhost:5000/profile")
      .then((r) => r.json())
      .then((data) => setProfile({
        name: data.name ?? "",
        email: data.email ?? "",
        avatarColor: data.avatarColor ?? "from-violet-400 to-fuchsia-500",
      }))
      .catch(() => {});
  };

  useEffect(() => {
    fetchProfile();
    // Re-fetch whenever window gets focus (e.g. after saving in Settings)
    window.addEventListener("focus", fetchProfile);
    return () => window.removeEventListener("focus", fetchProfile);
  }, []);

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5">
        <Logo />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 scrollbar-thin">
        <nav className="space-y-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => { window.open("/schedule", "_blank"); setOpen(false); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <CalendarDays className="h-4 w-4" />
            Schedule
          </button>
        </nav>

        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Channels
          </p>
          <nav className="space-y-1">
            {channelNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )
                }
              >
                <span className="flex items-center gap-3">
                  <ChannelIcon channel={item.channel} className={cn("h-4 w-4", `text-${item.channel}`)} />
                  {item.label}
                </span>
                {item.count > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary"
                  >
                    {item.count}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => navigate("/settings")}
          className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent"
        >
          <Avatar name={profile.name || "?"} color={profile.avatarColor} size={36} />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold">{profile.name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </div>
          <span
            role="button"
            aria-label="Log out"
            onClick={(e) => { e.stopPropagation(); navigate("/login"); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search leads, messages, tags…"
              className="h-10 rounded-full border-border bg-secondary/60 pl-9 pr-4 text-sm focus-visible:ring-primary"
            />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
              <Bell className="h-[1.1rem] w-[1.1rem]" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden bg-aurora">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
