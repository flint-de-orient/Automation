import { useEffect, useRef, useState } from "react";
import { Search, Send, X, Check, Paperclip, Image, FileText, Download } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { formatRelative, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { API_URL as API } from "@/lib/api";
const N8N_WP_WEBHOOK = "https://n8n.flintdeorient.in/webhook-test/whatsapp";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface Conversation {
  number: string;
  name: string;
  lastMessage: string;
  lastTimestamp: string;
}

interface WpMessage {
  sender: "user" | "ai";
  message: string;
  image?: string | null;
  timestamp: string;
}

interface SelectedFile {
  file: File;
  type: "image" | "document";
  previewURL: string;
}

const colors = [
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
  "from-violet-400 to-fuchsia-500",
];
const avatarColor = (s: string) => colors[(s || "a").charCodeAt(0) % colors.length];

// Treat "null"/"undefined" strings (from bad upstream data) as missing.
const clean = (s: string | null | undefined): string => {
  const t = (s ?? "").trim();
  return t === "" || t.toLowerCase() === "null" || t.toLowerCase() === "undefined" ? "" : t;
};
const displayName = (c: { name?: string | null; number: string }) =>
  clean(c.name) || c.number;

// ── AttachmentMenu ─────────────────────────────────────────────
function AttachmentMenu({
  onSelect,
  onClose,
}: {
  onSelect: (type: "image" | "document") => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-0 z-50 flex flex-col gap-1 rounded-xl bg-white py-2 shadow-xl"
      style={{ minWidth: 160, border: "1px solid #e9edef" }}
    >
      <button
        onClick={() => onSelect("image")}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
          <Image className="h-4 w-4 text-purple-600" />
        </span>
        Image
      </button>
      <button
        onClick={() => onSelect("document")}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
          <FileText className="h-4 w-4 text-blue-600" />
        </span>
        Document
      </button>
    </div>
  );
}

// ── FilePreview ────────────────────────────────────────────────
function FilePreview({
  selected,
  onRemove,
}: {
  selected: SelectedFile;
  onRemove: () => void;
}) {
  return (
    <div
      style={{ backgroundColor: "#f0f2f5", borderTop: "1px solid #e9edef" }}
      className="flex items-center gap-3 px-4 py-3"
    >
      {selected.type === "image" ? (
        <img
          src={selected.previewURL}
          alt="preview"
          className="h-14 w-14 rounded-lg object-cover shadow-sm"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-100">
          <FileText className="h-7 w-7 text-blue-600" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{selected.file.name}</p>
        <p className="text-xs text-gray-500">
          {(selected.file.size / 1024).toFixed(1)} KB · {selected.type}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
      >
        <X className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

// ── MessageBubble ──────────────────────────────────────────────
function MessageBubble({ msg }: { msg: WpMessage }) {
  const isUser = msg.sender === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-start" : "justify-end")}>
      <div
        style={{
          backgroundColor: isUser ? "#ffffff" : "#DCF8C6",
          borderRadius: isUser ? "0px 8px 8px 8px" : "8px 0px 8px 8px",
          maxWidth: "60%",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
        className="relative px-3 py-2 text-sm text-black"
      >
        {msg.image && (
          <img
            src={msg.image}
            alt="attachment"
            className="mb-1 max-h-60 w-full cursor-pointer rounded-lg object-cover"
            onClick={() => window.open(msg.image!, "_blank")}
          />
        )}
        {msg.message && (
          <p className="whitespace-pre-wrap break-words leading-snug">{msg.message}</p>
        )}
        <div className="mt-1 flex items-center justify-end gap-1">
          <span style={{ fontSize: "11px", color: "#667781" }}>{formatTime(msg.timestamp)}</span>
          {!isUser && (
            <span className="flex" style={{ color: "#53bdeb" }}>
              <Check className="h-3 w-3 -mr-1.5" />
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ChatInput ──────────────────────────────────────────────────
function ChatInput({
  draft,
  setDraft,
  onSend,
  selectedFile,
  setSelectedFile,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  selectedFile: SelectedFile | null;
  setSelectedFile: (f: SelectedFile | null) => void;
}) {
  const [showMenu, setShowMenu]   = useState(false);
  const imageInputRef             = useRef<HTMLInputElement>(null);
  const docInputRef               = useRef<HTMLInputElement>(null);

  const handleAttachSelect = (type: "image" | "document") => {
    setShowMenu(false);
    if (type === "image") imageInputRef.current?.click();
    else docInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "document") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Max size is 5MB.");
      return;
    }
    const previewURL = URL.createObjectURL(file);
    setSelectedFile({ file, type, previewURL });
    e.target.value = "";
  };

  const canSend = draft.trim() || selectedFile;

  return (
    <div style={{ backgroundColor: "#f0f2f5" }} className="shrink-0">
      {/* File preview strip */}
      {selectedFile && (
        <FilePreview selected={selectedFile} onRemove={() => setSelectedFile(null)} />
      )}

      {/* Input row */}
      <div className="relative flex items-end gap-2 px-4 py-3">
        {/* Hidden file inputs */}
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFileChange(e, "image")} />
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
          onChange={(e) => handleFileChange(e, "document")} />

        {/* Attachment button + menu */}
        <div className="relative shrink-0">
          {showMenu && (
            <AttachmentMenu onSelect={handleAttachSelect} onClose={() => setShowMenu(false)} />
          )}
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-200"
            style={{ color: "#54656f" }}
          >
            <Paperclip className="h-5 w-5" />
          </button>
        </div>

        {/* Text input */}
        <div
          style={{ backgroundColor: "#ffffff", borderRadius: "24px" }}
          className="flex flex-1 items-end px-4 py-2 shadow-sm"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
            }}
            placeholder={selectedFile ? "Add a caption…" : "Type a message"}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-black outline-none placeholder:text-gray-400 max-h-32"
            style={{ lineHeight: "1.5" }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!canSend}
          style={{ backgroundColor: "#25D366", borderRadius: "50%", width: 44, height: 44 }}
          className="flex shrink-0 items-center justify-center shadow-md transition-opacity disabled:opacity-50"
        >
          <Send className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── WhatsAppInbox ──────────────────────────────────────────────
export default function WhatsAppInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages]           = useState<WpMessage[]>([]);
  const [activeNumber, setActiveNumber]   = useState<string | null>(null);
  const [activeName, setActiveName]       = useState("");
  const [query, setQuery]                 = useState("");
  const [draft, setDraft]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [selectedFile, setSelectedFile]   = useState<SelectedFile | null>(null);
  const socketRef                         = useRef<Socket | null>(null);
  const bottomRef                         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(API);
    socketRef.current = socket;
    socket.on("new_message", (msg: WpMessage) => setMessages((p) => [...p, msg]));
    socket.on("conversation_updated", (updated: Conversation) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c.number === updated.number);
        const next = exists
          ? prev.map((c) => (c.number === updated.number ? { ...c, ...updated } : c))
          : [updated, ...prev];
        return next.sort((a, b) => +new Date(b.lastTimestamp) - +new Date(a.lastTimestamp));
      });
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (activeNumber && socketRef.current) socketRef.current.emit("join", activeNumber);
  }, [activeNumber]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (activeNumber) fetchMessages(activeNumber); }, [activeNumber]);

  const fetchConversations = async () => {
    try {
      const data: Conversation[] = await fetch(`${API}/wp/conversations`).then((r) => r.json());
      setConversations(data);
      if (data.length && !activeNumber) { setActiveNumber(data[0].number); setActiveName(data[0].name); }
    } catch { toast.error("Failed to load conversations"); }
  };

  const fetchMessages = async (number: string) => {
    setLoading(true);
    try {
      const data: WpMessage[] = await fetch(`${API}/wp/messages?number=${encodeURIComponent(number)}`).then((r) => r.json());
      setMessages(data);
    } catch { toast.error("Failed to load messages"); }
    finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if ((!draft.trim() && !selectedFile) || !activeNumber) return;
    const text = draft.trim();
    const file = selectedFile;
    setDraft("");
    setSelectedFile(null);

    try {
      if (file) {
        // Send file via FormData to n8n webhook
        const formData = new FormData();
        formData.append("number", activeNumber);
        formData.append("name", activeName);
        formData.append("message", text);
        formData.append("fileType", file.type);
        formData.append("file", file.file);
        await fetch(N8N_WP_WEBHOOK, { method: "POST", body: formData });
      } else {
        await fetch(N8N_WP_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: activeNumber, name: activeName, message: text }),
        });
      }
    } catch { toast.error("Failed to send message"); }
  };

  const filtered = conversations.filter((c) =>
    (c.name ?? "").toLowerCase().includes(query.toLowerCase()) ||
    (c.number ?? "").toLowerCase().includes(query.toLowerCase())
  );
  const active = conversations.find((c) => c.number === activeNumber) ?? null;

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">

      {/* ── LEFT: Conversation list ── */}
      <aside
        style={{ borderRight: "1px solid #e9edef" }}
        className={cn("flex w-full max-w-sm shrink-0 flex-col bg-white", activeNumber ? "hidden md:flex" : "flex")}
      >
        <div style={{ backgroundColor: "#f0f2f5" }} className="flex items-center gap-2 px-4 py-3">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="text-base font-semibold text-gray-800">WhatsApp</span>
        </div>

        <div style={{ backgroundColor: "#f0f2f5" }} className="px-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or start new chat"
              className="h-9 rounded-full border-0 bg-white pl-9 text-sm text-gray-700 placeholder:text-gray-400 focus-visible:ring-0" />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <li className="p-8 text-center text-sm text-gray-400">No conversations yet.</li>}
          {filtered.map((conv) => (
            <li key={conv.number}>
              <button onClick={() => { setActiveNumber(conv.number); setActiveName(clean(conv.name)); }}
                style={{ borderBottom: "1px solid #f0f2f5" }}
                className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  activeNumber === conv.number ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]")}>
                <Avatar name={displayName(conv)} color={avatarColor(conv.number)} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-[15px] font-medium text-gray-900">{displayName(conv)}</p>
                    <span style={{ fontSize: "12px", color: "#667781" }}>{formatRelative(conv.lastTimestamp)}</span>
                  </div>
                  <p className="truncate text-[13px]" style={{ color: "#667781" }}>{clean(conv.lastMessage)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── RIGHT: Chat panel ── */}
      <section className={cn("flex min-w-0 flex-1 flex-col", activeNumber ? "flex" : "hidden md:flex")}>
        {!active ? (
          <div style={{ backgroundColor: "#f0f2f5" }} className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
            <svg className="h-20 w-20 opacity-20" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <p className="text-lg font-light">Select a conversation to start</p>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: "#f0f2f5", borderBottom: "1px solid #e9edef" }}
              className="flex h-16 shrink-0 items-center gap-3 px-4">
              <button className="md:hidden mr-1 text-gray-500" onClick={() => setActiveNumber(null)}>
                <X className="h-5 w-5" />
              </button>
              <Avatar name={displayName(active)} color={avatarColor(active.number)} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-gray-900">{displayName(active)}</p>
                <p className="truncate text-xs" style={{ color: "#667781" }}>{active.number}</p>
              </div>
            </div>

            <div
              style={{ backgroundColor: "#ECE5DD", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8b89a' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
              className="flex-1 overflow-y-auto px-4 py-4"
            >
              {loading ? (
                <p className="text-center text-sm text-gray-500">Loading messages…</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {messages.length === 0 && <p className="text-center text-sm text-gray-500">No messages yet.</p>}
                  {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <ChatInput
              draft={draft} setDraft={setDraft} onSend={sendMessage}
              selectedFile={selectedFile} setSelectedFile={setSelectedFile}
            />
          </>
        )}
      </section>
    </div>
  );
}
