export type Channel = "whatsapp" | "facebook" | "instagram" | "email";

export type LeadStatus = "new" | "open" | "qualified" | "won" | "lost";

export interface Message {
  id: string;
  from: "lead" | "agent";
  text: string;
  timestamp: string;
  read?: boolean;
}

export interface Note {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  handle: string; // phone, username or email
  avatarColor: string;
  channel: Channel;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  status: LeadStatus;
  tags: string[];
  assignedTo?: string;
  messages: Message[];
  notes: Note[];
}

const colors = [
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
  "from-violet-400 to-fuchsia-500",
  "from-lime-400 to-green-500",
  "from-cyan-400 to-blue-500",
  "from-red-400 to-rose-500",
];

const c = (i: number) => colors[i % colors.length];

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

export const teamMembers = ["Alex Chen", "Priya Shah", "Marco Diaz", "Sara Kim"];

export const leads: Lead[] = [
  {
    id: "i1",
    name: "Lina Ozawa",
    handle: "@lina.ozawa",
    avatarColor: c(5),
    channel: "instagram",
    lastMessage: "Loved your latest reel 🔥",
    lastMessageAt: minutesAgo(5),
    unread: 3,
    status: "new",
    tags: ["engaged"],
    messages: [
      { id: "m1", from: "lead", text: "Hi!", timestamp: minutesAgo(7) },
      { id: "m2", from: "lead", text: "Are you taking new clients?", timestamp: minutesAgo(6) },
      { id: "m3", from: "lead", text: "Loved your latest reel 🔥", timestamp: minutesAgo(5) },
    ],
    notes: [],
  },
  {
    id: "i2",
    name: "Tomás Reyes",
    handle: "@tomas.reyes",
    avatarColor: c(6),
    channel: "instagram",
    lastMessage: "Sounds good, sending DM 🙌",
    lastMessageAt: minutesAgo(95),
    unread: 0,
    status: "qualified",
    tags: ["referral"],
    assignedTo: "Sara Kim",
    messages: [{ id: "m1", from: "lead", text: "Sounds good, sending DM 🙌", timestamp: minutesAgo(95) }],
    notes: [],
  },
];

export const channelMeta: Record<Channel, { label: string; color: string; bg: string }> = {
  whatsapp: { label: "WhatsApp", color: "text-whatsapp", bg: "bg-whatsapp/10" },
  facebook: { label: "Facebook", color: "text-facebook", bg: "bg-facebook/10" },
  instagram: { label: "Instagram", color: "text-instagram", bg: "bg-instagram/10" },
  email: { label: "Email", color: "text-email", bg: "bg-email/10" },
};
