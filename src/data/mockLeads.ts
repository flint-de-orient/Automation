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
    id: "w1",
    name: "Ravi Kumar",
    handle: "+91 98765 43210",
    avatarColor: c(0),
    channel: "whatsapp",
    lastMessage: "Yes, please send me the pricing brochure.",
    lastMessageAt: minutesAgo(3),
    unread: 2,
    status: "qualified",
    tags: ["pricing", "hot"],
    assignedTo: "Alex Chen",
    messages: [
      { id: "m1", from: "lead", text: "Hi! I saw your ad on Instagram.", timestamp: minutesAgo(45) },
      { id: "m2", from: "agent", text: "Hey Ravi! Glad you reached out. How can I help?", timestamp: minutesAgo(40) },
      { id: "m3", from: "lead", text: "Looking for a CRM for my agency.", timestamp: minutesAgo(20) },
      { id: "m4", from: "agent", text: "Perfect — we have plans starting at $29/mo.", timestamp: minutesAgo(10) },
      { id: "m5", from: "lead", text: "Yes, please send me the pricing brochure.", timestamp: minutesAgo(3) },
    ],
    notes: [{ id: "n1", author: "Alex Chen", text: "Decision maker, budget confirmed.", timestamp: minutesAgo(15) }],
  },
  {
    id: "w2",
    name: "Aisha Patel",
    handle: "+91 99887 11223",
    avatarColor: c(1),
    channel: "whatsapp",
    lastMessage: "Can we schedule a demo tomorrow?",
    lastMessageAt: minutesAgo(22),
    unread: 0,
    status: "open",
    tags: ["demo"],
    assignedTo: "Priya Shah",
    messages: [
      { id: "m1", from: "lead", text: "Can we schedule a demo tomorrow?", timestamp: minutesAgo(22) },
    ],
    notes: [],
  },
  {
    id: "w3",
    name: "Jamal Hussein",
    handle: "+971 50 123 4567",
    avatarColor: c(2),
    channel: "whatsapp",
    lastMessage: "Thanks, talk soon!",
    lastMessageAt: minutesAgo(180),
    unread: 0,
    status: "won",
    tags: ["closed"],
    messages: [{ id: "m1", from: "lead", text: "Thanks, talk soon!", timestamp: minutesAgo(180) }],
    notes: [],
  },
  {
    id: "f1",
    name: "Megan Walsh",
    handle: "@megan.walsh",
    avatarColor: c(3),
    channel: "facebook",
    lastMessage: "Do you ship to Canada?",
    lastMessageAt: minutesAgo(8),
    unread: 1,
    status: "new",
    tags: ["shipping"],
    messages: [
      { id: "m1", from: "lead", text: "Hi there!", timestamp: minutesAgo(15) },
      { id: "m2", from: "lead", text: "Do you ship to Canada?", timestamp: minutesAgo(8) },
    ],
    notes: [],
  },
  {
    id: "f2",
    name: "Carlos Mendes",
    handle: "@carlos.m",
    avatarColor: c(4),
    channel: "facebook",
    lastMessage: "Got it — I'll think about it.",
    lastMessageAt: minutesAgo(60),
    unread: 0,
    status: "open",
    tags: [],
    assignedTo: "Marco Diaz",
    messages: [
      { id: "m1", from: "agent", text: "Here's the comparison sheet 📎", timestamp: minutesAgo(70) },
      { id: "m2", from: "lead", text: "Got it — I'll think about it.", timestamp: minutesAgo(60) },
    ],
    notes: [],
  },
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
  {
    id: "e1",
    name: "Hannah Becker",
    handle: "hannah.b@northstar.io",
    avatarColor: c(7),
    channel: "email",
    lastMessage: "Re: Proposal for Q2 — looks great, a few questions inside.",
    lastMessageAt: minutesAgo(30),
    unread: 1,
    status: "qualified",
    tags: ["enterprise", "proposal"],
    assignedTo: "Alex Chen",
    messages: [
      { id: "m1", from: "agent", text: "Hi Hannah, attaching the Q2 proposal as discussed.", timestamp: minutesAgo(120) },
      { id: "m2", from: "lead", text: "Re: Proposal for Q2 — looks great, a few questions inside.", timestamp: minutesAgo(30) },
    ],
    notes: [{ id: "n1", author: "Alex Chen", text: "Enterprise tier, 50+ seats.", timestamp: minutesAgo(25) }],
  },
  {
    id: "e2",
    name: "Daniel O'Connor",
    handle: "daniel@brewhaus.co",
    avatarColor: c(0),
    channel: "email",
    lastMessage: "Unsubscribing — not the right fit, thanks.",
    lastMessageAt: minutesAgo(300),
    unread: 0,
    status: "lost",
    tags: [],
    messages: [{ id: "m1", from: "lead", text: "Unsubscribing — not the right fit, thanks.", timestamp: minutesAgo(300) }],
    notes: [],
  },
];

export const channelMeta: Record<Channel, { label: string; color: string; bg: string }> = {
  whatsapp: { label: "WhatsApp", color: "text-whatsapp", bg: "bg-whatsapp/10" },
  facebook: { label: "Facebook", color: "text-facebook", bg: "bg-facebook/10" },
  instagram: { label: "Instagram", color: "text-instagram", bg: "bg-instagram/10" },
  email: { label: "Email", color: "text-email", bg: "bg-email/10" },
};
