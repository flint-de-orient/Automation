import { useEffect, useRef, useState } from "react";
import { Search, Send, Smile, MoreHorizontal, PenSquare, X, Tag, UserPlus } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatRelative, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { io } from "socket.io-client";

import { API_URL as API } from "@/lib/api";
const N8N_FB_WEBHOOK = "https://n8n.flintdeorient.in/webhook-test/facebooksender";

interface Conversation {
  senderId: string;
  name: string;
  lastMessage: string;
  lastTimestamp: string;
}

interface FbMessage {
  sender: "user" | "ai";
  message: string;
  image?: string | null;
  timestamp: string;
}

const colors = [
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
  "from-violet-400 to-fuchsia-500",
];
const avatarColor = (s: string) => colors[(s || "a").charCodeAt(0) % colors.length];

function groupMessages(msgs: FbMessage[]) {
  const groups: { timestamp: string; items: FbMessage[] }[] = [];
  msgs.forEach((m) => {
    const last = groups[groups.length - 1];
    const diff = last
      ? (new Date(m.timestamp).getTime() - new Date(last.items[last.items.length - 1].timestamp).getTime()) / 60000
      : Infinity;
    if (!last || diff > 5) groups.push({ timestamp: m.timestamp, items: [m] });
    else last.items.push(m);
  });
  return groups;
}

function MessageBubble({ msg, convName, convSenderId }: { msg: FbMessage; convName: string; convSenderId: string }) {
  const isUser = msg.sender === "user";
  return (
    <div className={cn("flex items-end gap-2 w-full", isUser ? "justify-start" : "justify-end")}>
      {isUser && (
        <div className="shrink-0 mb-0.5">
          <Avatar name={convName || convSenderId} color={avatarColor(convSenderId)} size={28} />
        </div>
      )}
      <div className={cn("flex flex-col max-w-[62%]", isUser ? "items-start" : "items-end")}>
        {msg.image && (
          <img
            src={msg.image}
            alt="attachment"
            className="mb-1 max-h-56 rounded-2xl object-cover cursor-pointer"
            onClick={() => window.open(msg.image!, "_blank")}
          />
        )}
        {msg.message && (
          <div className={cn(
            "px-4 py-2.5 text-sm leading-snug",
            isUser
              ? "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md"
              : "bg-purple-600 text-white rounded-2xl rounded-br-md"
          )}>
            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
          </div>
        )}
        <div className={cn("flex items-center gap-1 mt-0.5", isUser ? "flex-row" : "flex-row-reverse")}>
          <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
        </div>
      </div>
      {!isUser && <div className="w-7 shrink-0" />}
    </div>
  );
}

export default function FacebookInbox() {
  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [messages, setMessages]             = useState<FbMessage[]>([]);
  const [activeSenderId, setActiveSenderId] = useState<string | null>(null);
  const [activeName, setActiveName]         = useState("");
  const [query, setQuery]                   = useState("");
  const [draft, setDraft]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [showDetails, setShowDetails]       = useState(false);
  const [assignedTo, setAssignedTo]         = useState("Unassigned");
  const [tags, setTags]                     = useState<string[]>([]);
  const [tagInput, setTagInput]             = useState("");
  const [notes, setNotes]                   = useState<{ id: string; text: string; ts: string }[]>([]);
  const [noteInput, setNoteInput]           = useState("");
  const bottomRef                           = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (activeSenderId) fetchMessages(activeSenderId); }, [activeSenderId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const socket = io(API);
    socket.on("fb_new_message", (msg: FbMessage & { senderId: string }) => {
      setMessages((prev) => msg.senderId === activeSenderId ? [...prev, msg] : prev);
      setConversations((prev) =>
        prev.map((c) => c.senderId === msg.senderId
          ? { ...c, lastMessage: msg.message, lastTimestamp: msg.timestamp }
          : c
        )
      );
    });
    socket.on("fb_conversation_updated", (u: Conversation) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c.senderId === u.senderId);
        if (exists) return prev.map((c) => c.senderId === u.senderId ? { ...c, ...u } : c);
        return [u, ...prev];
      });
    });
    if (activeSenderId) socket.emit("join", `fb_${activeSenderId}`);
    return () => { socket.disconnect(); };
  }, [activeSenderId]);

  const fetchConversations = async () => {
    try {
      const data: Conversation[] = await fetch(`${API}/fb/conversations`).then((r) => r.json());
      setConversations(data);
      if (data.length && !activeSenderId) {
        setActiveSenderId(data[0].senderId);
        setActiveName(data[0].name);
      }
    } catch { toast.error("Failed to load conversations"); }
  };

  const fetchMessages = async (senderId: string) => {
    setLoading(true);
    try {
      const data: FbMessage[] = await fetch(
        `${API}/fb/messages?senderId=${encodeURIComponent(senderId)}`
      ).then((r) => r.json());
      setMessages(data);
    } catch { toast.error("Failed to load messages"); }
    finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!draft.trim() || !activeSenderId) return;
    const text = draft.trim();
    setDraft("");

    const trimmedName = (activeName ?? "").trim();
    const parts = trimmedName.length ? trimmedName.split(/\s+/) : [];
    const first_name = parts[0] ?? "";
    const last_name  = parts.slice(1).join(" ");

    // 1) Send to webhook first
    try {
      const hookRes = await fetch(N8N_FB_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: activeSenderId, first_name, last_name, message: text }),
      });
      if (!hookRes.ok) toast.error(`Webhook returned ${hookRes.status}`);
    } catch {
      toast.error("Webhook unreachable (check n8n / CORS)");
    }

    // 2) Save to DB and show in chatbox
    try {
      const saved = await fetch(`${API}/fb/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: activeSenderId, name: activeName, message: text, sender: "ai" as const }),
      }).then((r) => r.json());

      if (saved?.success) {
        setMessages((prev) => [...prev, saved.data]);
        setConversations((prev) =>
          prev.map((c) => c.senderId === activeSenderId
            ? { ...c, lastMessage: text, lastTimestamp: new Date().toISOString() }
            : c
          )
        );
      } else {
        toast.error("Failed to save message");
      }
    } catch {
      toast.error("Failed to save message");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((p) => [...p, tagInput.trim()]);
      setTagInput("");
    }
  };

  const addNote = () => {
    if (noteInput.trim()) {
      setNotes((p) => [...p, { id: crypto.randomUUID(), text: noteInput.trim(), ts: new Date().toISOString() }]);
      setNoteInput("");
    }
  };

  const filtered = conversations.filter((c) =>
    (c.name ?? "").toLowerCase().includes(query.toLowerCase())
  );

  const active  = conversations.find((c) => c.senderId === activeSenderId) ?? null;
  const grouped = groupMessages(messages);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-white">

      {/* ── LEFT SIDEBAR ── */}
      <aside className={cn(
        "flex w-full max-w-[340px] shrink-0 flex-col border-r border-gray-200 bg-white",
        activeSenderId ? "hidden md:flex" : "flex"
      )}>
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
          <div className="flex items-center gap-1">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              <PenSquare className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Messenger"
              className="h-9 w-full rounded-full bg-gray-100 pl-9 pr-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="p-8 text-center text-sm text-gray-400">No conversations yet.</li>
          )}
          {filtered.map((conv) => (
            <li key={conv.senderId}>
              <button
                onClick={() => { setActiveSenderId(conv.senderId); setActiveName(conv.name); setShowDetails(false); }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors rounded-xl mx-1",
                  activeSenderId === conv.senderId ? "bg-blue-50" : "hover:bg-gray-100"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar name={conv.name || conv.senderId} color={avatarColor(conv.senderId)} size={48} />
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-gray-900">{conv.name || conv.senderId}</p>
                  <p className="truncate text-xs text-gray-500">
                    {conv.lastMessage ? `${conv.lastMessage.slice(0, 30)}${conv.lastMessage.length > 30 ? "…" : ""}` : ""}
                    {conv.lastTimestamp && (
                      <span className="text-gray-400"> · {formatRelative(conv.lastTimestamp)}</span>
                    )}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── RIGHT CHAT AREA ── */}
      <section className={cn(
        "flex min-w-0 flex-1 flex-col bg-white",
        activeSenderId ? "flex" : "hidden md:flex"
      )}>
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-10 w-10 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
                </svg>
              </div>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4">
              <button className="md:hidden mr-1 text-gray-500" onClick={() => setActiveSenderId(null)}>←</button>
              <Avatar name={active.name || active.senderId} color={avatarColor(active.senderId)} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-gray-900">{active.name || active.senderId}</p>
              </div>
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </header>

            {/* Body row: messages + details panel */}
            <div className="flex min-h-0 flex-1">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-white px-4 py-4">
                {loading ? (
                  <p className="text-center text-sm text-gray-400">Loading messages…</p>
                ) : (
                  <div className="mx-auto flex max-w-2xl flex-col gap-1">
                    {messages.length === 0 && (
                      <p className="text-center text-sm text-gray-400">No messages yet.</p>
                    )}
                    {grouped.map((group, gi) => (
                      <div key={gi} className="flex flex-col gap-1">
                        <div className="my-3 flex items-center justify-center">
                          <span className="text-[11px] font-medium text-gray-400">{formatTime(group.timestamp)}</span>
                        </div>
                        {group.items.map((m, mi) => (
                          <MessageBubble
                            key={`${gi}-${mi}`}
                            msg={m}
                            convName={active.name}
                            convSenderId={active.senderId}
                          />
                        ))}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Lead Details Panel */}
              {showDetails && (
                <aside className="w-72 shrink-0 border-l border-gray-100 bg-white flex flex-col overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">Lead details</p>
                    <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center px-4 pt-5 pb-4 border-b border-gray-100">
                    <Avatar name={active.name || active.senderId} color={avatarColor(active.senderId)} size={56} />
                    <p className="mt-3 text-base font-bold text-gray-900">{active.name || active.senderId}</p>
                    <p className="text-xs text-gray-400">@{active.name?.toLowerCase().replace(/\s+/g, ".") || active.senderId}</p>
                    <span className="mt-2 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-600">new</span>
                  </div>

                  <div className="flex flex-col gap-5 px-4 py-4">
                    {/* Assigned to */}
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        <UserPlus className="h-3.5 w-3.5" /> Assigned to
                      </p>
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-purple-300"
                      >
                        <option>Unassigned</option>
                        <option>Alex Chen</option>
                        <option>Sara Kim</option>
                        <option>John Doe</option>
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        <Tag className="h-3.5 w-3.5" /> Tags
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.length === 0 && <p className="text-xs text-gray-400">No tags yet.</p>}
                        {tags.map((t) => (
                          <span key={t} className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                            {t}
                            <button onClick={() => setTags((p) => p.filter((x) => x !== t))} className="text-purple-400 hover:text-purple-700">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTag()}
                          placeholder="Add tag…"
                          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:border-purple-300"
                        />
                        <button onClick={addTag} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">Add</button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Notes</p>
                      <div className="mb-2 flex flex-col gap-2">
                        {notes.length === 0 && <p className="text-xs text-gray-400">No notes yet.</p>}
                        {notes.map((n) => (
                          <div key={n.id} className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                            <p>{n.text}</p>
                            <p className="mt-1 text-[10px] text-gray-400">{formatTime(n.ts)}</p>
                          </div>
                        ))}
                      </div>
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Write a note…"
                        rows={2}
                        className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-purple-300"
                      />
                      <button
                        onClick={addNote}
                        disabled={!noteInput.trim()}
                        className="mt-1.5 w-full rounded-lg bg-purple-600 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-40"
                      >
                        Add note
                      </button>
                    </div>
                  </div>
                </aside>
              )}

            </div>{/* end body row */}

            {/* Input bar */}
            <footer className="shrink-0 border-t border-gray-100 bg-white px-3 py-2.5">
              <div className="mx-auto flex max-w-2xl items-center gap-1">
                <div className="relative flex flex-1 items-center">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    placeholder="Aa"
                    rows={1}
                    className="w-full resize-none rounded-full bg-gray-100 py-2 pl-4 pr-10 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-200 max-h-28"
                    style={{ lineHeight: "1.5" }}
                  />
                  <button className="absolute right-3 text-gray-400 hover:text-yellow-400">
                    <Smile className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!draft.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-blue-500 hover:bg-blue-50 disabled:opacity-30"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
