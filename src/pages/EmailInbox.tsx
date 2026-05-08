import { useEffect, useState } from "react";
import { Search, Send, X, Mail } from "lucide-react";
import DOMPurify from "dompurify";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API = "http://localhost:5000";

interface Conversation {
  email: string;
  name: string;
  lastMessage: string;
  lastTimestamp: string;
}

interface ChatMessage {
  type: "email" | "text";
  html?: string;
  text?: string;
  timestamp: string;
}

const colors = [
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
  "from-violet-400 to-fuchsia-500",
];
const avatarColor = (email: string) => colors[email.charCodeAt(0) % colors.length];

export default function EmailInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [activeName, setActiveName] = useState<string>("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when active email changes
  useEffect(() => {
    if (activeEmail) fetchMessages(activeEmail);
  }, [activeEmail]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/conversations`);
      const data: Conversation[] = await res.json();
      setConversations(data);
      if (data.length && !activeEmail) {
        setActiveEmail(data[0].email);
        setActiveName(data[0].name);
      }
    } catch {
      toast.error("Failed to load conversations");
    }
  };

  const fetchMessages = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat/${encodeURIComponent(email)}`);
      const data: ChatMessage[] = await res.json();
      setMessages(data);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const N8N_WEBHOOK = "https://n8n.flintdeorient.in/webhook-test/send-reply";

  const sendMessage = async () => {
    if (!draft.trim() || !activeEmail) return;
    const text = draft.trim();
    setDraft("");
    try {
      // 1. Send to n8n webhook
      await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail, name: activeName, message: text }),
      });

      // 2. Save to MongoDB
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail, name: activeName, sender: "ai", message: text }),
      });
      const data = await res.json();
      if (data.success) {
        // Re-fetch to get the rendered email template version
        await fetchMessages(activeEmail);
        setConversations((prev) =>
          prev.map((c) =>
            c.email === activeEmail
              ? { ...c, lastMessage: text, lastTimestamp: new Date().toISOString() }
              : c
          )
        );
      }
    } catch {
      toast.error("Failed to send message");
    }
  };

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase())
  );

  const active = conversations.find((c) => c.email === activeEmail) ?? null;

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Conversation list */}
      <aside
        className={cn(
          "flex w-full max-w-sm shrink-0 flex-col border-r border-border bg-card",
          activeEmail ? "hidden md:flex" : "flex"
        )}
      >
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-email" />
            <h2 className="text-lg font-bold tracking-tight">Email Inbox</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "conversation" : "conversations"}
          </p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="h-9 rounded-full bg-secondary/60 pl-9"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              No conversations yet.
            </li>
          )}
          {filtered.map((conv) => (
            <li key={conv.email}>
              <button
                onClick={() => {
                  setActiveEmail(conv.email);
                  setActiveName(conv.name);
                }}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border/60 p-3 text-left transition-colors",
                  activeEmail === conv.email ? "bg-accent/60" : "hover:bg-accent/30"
                )}
              >
                <Avatar name={conv.name} color={avatarColor(conv.email)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{conv.name}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelative(conv.lastTimestamp)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-blue-500">{conv.email}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{conv.lastMessage}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat panel */}
      <section
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-background",
          activeEmail ? "flex" : "hidden md:flex"
        )}
      >
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a conversation to start.
          </div>
        ) : (
          <>
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setActiveEmail(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Avatar name={active.name} color={avatarColor(active.email)} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{active.name}</p>
                <p className="truncate text-xs text-muted-foreground">{active.email}</p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-aurora p-4 scrollbar-thin md:p-6">
              {loading ? (
                <p className="text-center text-sm text-muted-foreground">Loading messages…</p>
              ) : (
                <div className="mx-auto flex max-w-2xl flex-col gap-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className="flex animate-fade-in flex-col">
                      {m.type === "email" ? (
                        // AI → right aligned email card
                        <div className="flex justify-end">
                          <div className="w-full max-w-[90%] overflow-hidden rounded-2xl border border-border bg-white shadow-md">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(m.html ?? "", {
                                  ADD_TAGS: ["table", "tr", "td", "img", "a", "b", "p"],
                                  ADD_ATTR: ["width", "cellpadding", "cellspacing", "style", "src", "href", "target"],
                                }),
                              }}
                            />
                            <p className="px-4 pb-2 text-right text-[10px] text-muted-foreground">
                              {formatTime(m.timestamp)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // User → left aligned bubble
                        <div className="flex justify-start">
                          <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-sm text-foreground shadow-sm">
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {formatTime(m.timestamp)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-border bg-card p-3">
              <div className="mx-auto flex max-w-2xl items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`Reply to ${active.name}…`}
                  rows={1}
                  className="min-h-10 max-h-32 flex-1 resize-none rounded-2xl bg-secondary/60"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!draft.trim()}
                  size="icon"
                  className="shrink-0 rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
