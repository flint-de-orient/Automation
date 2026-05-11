import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { API_URL as API } from "@/lib/api";

interface ChannelCard {
  label: string;
  route: string;
  apiUrl: string;
  icon: React.ReactNode;
  bg: string;
  iconBg: string;
  border: string;
  countColor: string;
}

const channels: ChannelCard[] = [
  {
    label: "Facebook Leads",
    route: "/leads/facebook",
    apiUrl: `${API}/fb/conversations`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
      </svg>
    ),
    bg: "from-blue-50 to-blue-100",
    iconBg: "bg-blue-600 text-white",
    border: "border-blue-200",
    countColor: "text-blue-700",
  },
  {
    label: "Instagram Leads",
    route: "/inbox/instagram",
    apiUrl: "",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    bg: "from-pink-50 to-purple-100",
    iconBg: "bg-gradient-to-br from-pink-500 to-purple-600 text-white",
    border: "border-pink-200",
    countColor: "text-pink-700",
  },
  {
    label: "WhatsApp Leads",
    route: "/inbox/whatsapp",
    apiUrl: `${API}/wp/conversations`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    bg: "from-green-50 to-emerald-100",
    iconBg: "bg-green-500 text-white",
    border: "border-green-200",
    countColor: "text-green-700",
  },
  {
    label: "Email Leads",
    route: "/inbox/email",
    apiUrl: `${API}/conversations`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
    bg: "from-orange-50 to-amber-100",
    iconBg: "bg-orange-500 text-white",
    border: "border-orange-200",
    countColor: "text-orange-700",
  },
];

export default function LeadsBox() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    channels.forEach((ch) => {
      if (!ch.apiUrl) return;
      fetch(ch.apiUrl)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCounts((prev) => ({ ...prev, [ch.label]: data.length }));
          }
        })
        .catch(() => {});
    });
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Leads Box</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All your leads across every channel in one place.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((ch) => (
          <button
            key={ch.label}
            onClick={() => navigate(ch.route)}
            className={`group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${ch.bg} ${ch.border}`}
          >
            {/* Icon */}
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${ch.iconBg}`}>
              {ch.icon}
            </div>

            {/* Label + count */}
            <div>
              <p className="text-sm font-medium text-gray-600">{ch.label}</p>
              <p className={`mt-0.5 text-3xl font-bold tracking-tight ${ch.countColor}`}>
                {counts[ch.label] ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {counts[ch.label] === 1 ? "conversation" : "conversations"}
              </p>
            </div>

            {/* Arrow */}
            <ArrowUpRight
              className={`absolute right-4 top-4 h-4 w-4 text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${ch.countColor}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
