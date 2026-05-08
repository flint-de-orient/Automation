import { useMemo, useState, useEffect } from "react";
import { Search, Download } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ChannelIcon } from "@/components/ChannelIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Channel, channelMeta } from "@/data/mockLeads";
import { formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API = "http://localhost:5000";
const channels: (Channel | "all")[] = ["all", "whatsapp", "facebook", "instagram", "email"];

const colorPalette = [
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
  "from-violet-400 to-fuchsia-500",
  "from-lime-400 to-green-500",
  "from-cyan-400 to-blue-500",
  "from-red-400 to-rose-500",
];
const pickColor = (s: string) => colorPalette[Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % colorPalette.length];

interface UnifiedContact {
  id: string;
  name: string;
  handle: string;
  avatarColor: string;
  channel: Channel;
  status: string;
  tags: string[];
  assignedTo?: string;
  lastMessageAt: string;
}

export default function Contacts() {
  const [query, setQuery]     = useState("");
  const [active, setActive]   = useState<Channel | "all">("all");
  const [contacts, setContacts] = useState<UnifiedContact[]>([]);

  useEffect(() => {
    const toContact = (channel: Channel, id: string, name: string, handle: string, ts: string): UnifiedContact => ({
      id: `${channel}-${id}`,
      name: name || handle,
      handle,
      avatarColor: pickColor(id),
      channel,
      status: "open",
      tags: [],
      lastMessageAt: ts,
    });

    Promise.allSettled([
      fetch(`${API}/conversations`).then((r) => r.json()),
      fetch(`${API}/fb/conversations`).then((r) => r.json()),
      fetch(`${API}/wp/conversations`).then((r) => r.json()),
    ]).then(([emailRes, fbRes, wpRes]) => {
      const all: UnifiedContact[] = [];

      if (emailRes.status === "fulfilled" && Array.isArray(emailRes.value))
        emailRes.value.forEach((c: { email: string; name: string; lastTimestamp: string }) =>
          all.push(toContact("email", c.email, c.name, c.email, c.lastTimestamp))
        );

      if (fbRes.status === "fulfilled" && Array.isArray(fbRes.value))
        fbRes.value.forEach((c: { senderId: string; name: string; lastTimestamp: string }) =>
          all.push(toContact("facebook", c.senderId, c.name, c.senderId, c.lastTimestamp))
        );

      if (wpRes.status === "fulfilled" && Array.isArray(wpRes.value))
        wpRes.value.forEach((c: { number: string; name: string; lastTimestamp: string }) =>
          all.push(toContact("whatsapp", c.number, c.name, c.number, c.lastTimestamp))
        );

      setContacts(all);
    }).catch(() => toast.error("Failed to load contacts"));
  }, []);

  const filtered = useMemo(() => {
    let list = contacts;
    if (active !== "all") list = list.filter((l) => l.channel === active);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.handle.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [contacts, query, active]);

  const exportCSV = () => {
    const rows = [
      ["Name", "Handle", "Channel", "Status", "Tags", "Assigned", "Last activity"],
      ...filtered.map((l) => [
        l.name, l.handle, l.channel, l.status,
        l.tags.join("|"), l.assignedTo ?? "", l.lastMessageAt,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unibox-contacts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contacts exported");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">All leads across every channel.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, handle or tag…"
            className="h-10 rounded-full bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {channels.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={active === c ? "default" : "outline"}
              onClick={() => setActive(c)}
              className={cn(
                "h-8 rounded-full text-xs capitalize",
                active === c && "bg-gradient-primary text-primary-foreground"
              )}
            >
              {c === "all" ? "All" : channelMeta[c].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
        {/* Mobile */}
        <ul className="divide-y divide-border md:hidden">
          {filtered.map((l) => {
            const meta = channelMeta[l.channel];
            return (
              <li key={l.id} className="flex items-center gap-3 p-4">
                <Avatar name={l.name} color={l.avatarColor} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.handle}</p>
                </div>
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", meta.bg)}>
                  <ChannelIcon channel={l.channel} className={cn("h-3.5 w-3.5", meta.color)} />
                </span>
              </li>
            );
          })}
        </ul>

        {/* Desktop */}
        <table className="hidden w-full text-sm md:table">
          <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Channel</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Tags</th>
              <th className="px-4 py-3 text-left font-semibold">Assigned</th>
              <th className="px-4 py-3 text-left font-semibold">Last activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((l) => {
              const meta = channelMeta[l.channel];
              return (
                <tr key={l.id} className="transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={l.name} color={l.avatarColor} size={36} />
                      <div>
                        <p className="font-semibold">{l.name}</p>
                        <p className="text-xs text-muted-foreground">{l.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", meta.bg, meta.color)}>
                      <ChannelIcon channel={l.channel} className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">{l.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {l.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-[11px]">{t}</Badge>
                      ))}
                      {l.tags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {l.assignedTo ?? <span className="text-muted-foreground">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatRelative(l.lastMessageAt)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
