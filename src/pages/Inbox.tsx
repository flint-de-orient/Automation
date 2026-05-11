import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Send, Paperclip, Smile, Phone, Video, MoreVertical, Tag, UserPlus, X, Filter } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ChannelIcon } from "@/components/ChannelIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Channel, Lead, channelMeta, leads as seedLeads, teamMembers } from "@/data/mockLeads";
import { formatRelative, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { API_URL as API } from "@/lib/api";

const emailColors = [
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
  "from-violet-400 to-fuchsia-500",
];

export default function Inbox() {
  const { channel } = useParams<{ channel?: Channel }>();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(seedLeads.filter((l) => l.channel !== "email"));
  const [emailLeads, setEmailLeads] = useState<Lead[]>([]);

  // Fetch email leads from MongoDB
  useEffect(() => {
    fetch(`${API}/conversations`)
      .then((r) => r.json())
      .then((data: { email: string; name: string; lastMessage: string; lastTimestamp: string }[]) => {
        if (!Array.isArray(data)) return;
        const mapped: Lead[] = data.map((c, i) => ({
          id: `email-${c.email}`,
          name: c.name,
          handle: c.email,
          avatarColor: emailColors[i % emailColors.length],
          channel: "email" as Channel,
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastTimestamp,
          unread: 0,
          status: "open" as const,
          tags: [],
          messages: [],
          notes: [],
        }));
        setEmailLeads(mapped);
      })
      .catch(() => {});
  }, []);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const allLeads = useMemo(() => [...leads, ...emailLeads], [leads, emailLeads]);

  const filtered = useMemo(() => {
    let list = allLeads;
    if (channel) list = list.filter((l) => l.channel === channel);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.handle.toLowerCase().includes(q) ||
          l.lastMessage.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  }, [allLeads, channel, query]);

  // Auto-select first
  useEffect(() => {
    if (!activeId && filtered.length) setActiveId(filtered[0].id);
    if (activeId && !filtered.find((l) => l.id === activeId)) {
      setActiveId(filtered[0]?.id ?? null);
    }
  }, [filtered, activeId]);

  const active = allLeads.find((l) => l.id === activeId) ?? null;

  const sendMessage = () => {
    if (!draft.trim() || !active) return;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === active.id
          ? {
              ...l,
              lastMessage: draft,
              lastMessageAt: new Date().toISOString(),
              unread: 0,
              messages: [
                ...l.messages,
                { id: crypto.randomUUID(), from: "agent", text: draft, timestamp: new Date().toISOString() },
              ],
            }
          : l
      )
    );
    setDraft("");
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Handle", "Channel", "Status", "Tags", "Assigned", "Last message", "Last activity"],
      ...filtered.map((l) => [
        l.name,
        l.handle,
        l.channel,
        l.status,
        l.tags.join(" | "),
        l.assignedTo ?? "",
        l.lastMessage.replace(/\n/g, " "),
        l.lastMessageAt,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unibox-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported to CSV");
  };

  const updateActive = (patch: Partial<Lead>) => {
    if (!active) return;
    setLeads((prev) => prev.map((l) => (l.id === active.id ? { ...l, ...patch } : l)));
  };

  const addTag = (tag: string) => {
    if (!active || !tag.trim()) return;
    if (active.tags.includes(tag)) return;
    updateActive({ tags: [...active.tags, tag] });
  };

  const removeTag = (tag: string) => {
    if (!active) return;
    updateActive({ tags: active.tags.filter((t) => t !== tag) });
  };

  const addNote = (text: string) => {
    if (!active || !text.trim()) return;
    updateActive({
      notes: [
        ...active.notes,
        { id: crypto.randomUUID(), author: "Alex Chen", text, timestamp: new Date().toISOString() },
      ],
    });
    toast.success("Note added");
  };

  const channelLabel = channel ? channelMeta[channel].label : "Unified";

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Lead list */}
      <aside
        className={cn(
          "flex w-full max-w-sm shrink-0 flex-col border-r border-border bg-card lg:max-w-sm",
          activeId ? "hidden md:flex" : "flex"
        )}
      >
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">{channelLabel} Inbox</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Filter">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by channel</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/inbox")}>All channels</DropdownMenuItem>
                  {(["whatsapp", "facebook", "instagram", "email"] as Channel[]).map((c) => (
                    <DropdownMenuItem key={c} onClick={() => navigate(`/inbox/${c}`)}>
                      <ChannelIcon channel={c} className={cn("mr-2 h-4 w-4", channelMeta[c].color)} />
                      {channelMeta[c].label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportCSV}>Export CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, number, tag…"
              className="h-9 rounded-full bg-secondary/60 pl-9"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">No leads found.</li>
          )}
          {filtered.map((lead) => {
            const meta = channelMeta[lead.channel];
            const isActive = lead.id === activeId;
            return (
              <li key={lead.id}>
                <button
                  onClick={() => {
                    if (lead.channel === "email") {
                      navigate(`/inbox/email`);
                    } else {
                      setActiveId(lead.id);
                    }
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border/60 p-3 text-left transition-colors",
                    isActive ? "bg-accent/60" : "hover:bg-accent/30"
                  )}
                >
                  <div className="relative">
                    <Avatar name={lead.name} color={lead.avatarColor} />
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card",
                        meta.bg
                      )}
                    >
                      <ChannelIcon channel={lead.channel} className={cn("h-2.5 w-2.5", meta.color)} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{lead.name}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelative(lead.lastMessageAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{lead.handle}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">{lead.lastMessage}</p>
                      {lead.unread > 0 && (
                        <Badge className="h-5 min-w-5 shrink-0 justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
                          {lead.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Chat */}
      <section
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-background",
          activeId ? "flex" : "hidden md:flex"
        )}
      >
        {!active ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            Select a conversation to start.
          </div>
        ) : (
          <>
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setActiveId(null)}
                aria-label="Back"
              >
                <X className="h-4 w-4" />
              </Button>
              <Avatar name={active.name} color={active.avatarColor} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{active.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {channelMeta[active.channel].label} · {active.handle}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Call">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Video">
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetails((v) => !v)}
                aria-label="Details"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto bg-aurora p-4 scrollbar-thin md:p-6">
              <div className="mx-auto flex max-w-2xl flex-col gap-3">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex animate-fade-in",
                      m.from === "agent" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                        m.from === "agent"
                          ? "rounded-br-md bg-gradient-primary text-primary-foreground"
                          : "rounded-bl-md bg-card text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          m.from === "agent" ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {formatTime(m.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <footer className="shrink-0 border-t border-border bg-card p-3">
              <div className="mx-auto flex max-w-2xl items-end gap-2">
                <Button variant="ghost" size="icon" className="shrink-0" aria-label="Attach">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden shrink-0 sm:inline-flex" aria-label="Emoji">
                  <Smile className="h-4 w-4" />
                </Button>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`Message ${active.name}…`}
                  rows={1}
                  className="min-h-10 max-h-32 flex-1 resize-none rounded-2xl bg-secondary/60"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!draft.trim()}
                  size="icon"
                  className="shrink-0 rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>

      {/* Details panel */}
      {active && showDetails && (
        <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-card lg:flex">
          <DetailsPanel
            lead={active}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onAddNote={addNote}
            onAssign={(member) => updateActive({ assignedTo: member })}
            onClose={() => setShowDetails(false)}
          />
        </aside>
      )}
    </div>
  );
}

function DetailsPanel({
  lead,
  onAddTag,
  onRemoveTag,
  onAddNote,
  onAssign,
  onClose,
}: {
  lead: Lead;
  onAddTag: (t: string) => void;
  onRemoveTag: (t: string) => void;
  onAddNote: (t: string) => void;
  onAssign: (m: string) => void;
  onClose: () => void;
}) {
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <p className="text-sm font-semibold">Lead details</p>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="flex flex-col items-center text-center">
          <Avatar name={lead.name} color={lead.avatarColor} size={64} />
          <p className="mt-3 text-base font-bold">{lead.name}</p>
          <p className="text-xs text-muted-foreground">{lead.handle}</p>
          <Badge variant="secondary" className="mt-2 capitalize">
            {lead.status}
          </Badge>
        </div>

        <div className="mt-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <UserPlus className="h-3.5 w-3.5" /> Assigned to
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {lead.assignedTo ?? "Unassigned"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {teamMembers.map((m) => (
                <DropdownMenuItem key={m} onClick={() => onAssign(m)}>
                  {m}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3.5 w-3.5" /> Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lead.tags.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1">
                {t}
                <button onClick={() => onRemoveTag(t)} aria-label={`Remove ${t}`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {lead.tags.length === 0 && <p className="text-xs text-muted-foreground">No tags yet.</p>}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onAddTag(tag);
              setTag("");
            }}
          >
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Add tag…"
              className="h-8 text-xs"
              maxLength={24}
            />
            <Button type="submit" size="sm" variant="secondary">Add</Button>
          </form>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
          <ul className="space-y-2">
            {lead.notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-secondary/60 p-3 text-sm">
                <p>{n.text}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {n.author} · {formatRelative(n.timestamp)}
                </p>
              </li>
            ))}
            {lead.notes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
          </ul>
          <form
            className="mt-2 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              onAddNote(note);
              setNote("");
            }}
          >
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a note…"
              rows={2}
              maxLength={500}
              className="text-sm"
            />
            <Button type="submit" size="sm" className="w-full" disabled={!note.trim()}>
              Add note
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
