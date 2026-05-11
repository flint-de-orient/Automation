import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp, Users, MessageSquare, CheckCircle2 } from "lucide-react";
import { ChannelIcon } from "@/components/ChannelIcon";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui/badge";
import { Channel, channelMeta, leads } from "@/data/mockLeads";
import { formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";

import { API_URL as API } from "@/lib/api";
const channels: Channel[] = ["whatsapp", "facebook", "instagram", "email"];

export default function Dashboard() {
  const [counts, setCounts] = useState<Record<Channel, number>>({
    whatsapp: 0, facebook: 0, instagram: 0, email: 0,
  });

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/conversations`).then((r) => r.json()),
      fetch(`${API}/fb/conversations`).then((r) => r.json()),
      fetch(`${API}/wp/conversations`).then((r) => r.json()),
    ]).then(([emailRes, fbRes, wpRes]) => {
      setCounts({
        email:     emailRes.status === "fulfilled" && Array.isArray(emailRes.value) ? emailRes.value.length : 0,
        facebook:  fbRes.status === "fulfilled"    && Array.isArray(fbRes.value)    ? fbRes.value.length    : 0,
        whatsapp:  wpRes.status === "fulfilled"    && Array.isArray(wpRes.value)    ? wpRes.value.length    : 0,
        instagram: leads.filter((l) => l.channel === "instagram").length,
      });
    }).catch(() => {});
  }, []);;

  const stats = [
    { label: "Total leads", value: leads.length.toString(), delta: "+12%", icon: Users },
    { label: "Open conversations", value: "24", delta: "+8%", icon: MessageSquare },
    { label: "Qualified this week", value: "9", delta: "+3", icon: CheckCircle2 },
    { label: "Response rate", value: "94%", delta: "+2.1%", icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Good morning, Alex 👋</h1>
        <p className="mt-1 text-muted-foreground">Here's what's happening across your channels today.</p>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-4 shadow-elegant animate-fade-in md:p-5"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-primary/10 p-2">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-success">{s.delta}</span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Channel cards */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Channels</h2>
          <Link to="/inbox" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((ch) => {
            const count = counts[ch];
            const meta  = channelMeta[ch];
            return (
              <Link
                key={ch}
                to={`/inbox/${ch}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-elegant transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", meta.bg)}>
                    <ChannelIcon channel={ch} className={cn("h-5 w-5", meta.color)} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="mt-4 text-sm font-medium text-muted-foreground">{meta.label}</p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight">{count} leads</p>
                <div className="mt-3 flex items-center gap-2">
                  {count === 0 ? (
                    <Badge variant="secondary">All caught up</Badge>
                  ) : (
                    <Badge className="bg-primary text-primary-foreground">{count} active</Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Recent leads</h2>
          <Link to="/inbox" className="text-sm font-medium text-primary hover:underline">
            Open inbox
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
          <ul className="divide-y divide-border">
            {[...leads]
              .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt))
              .slice(0, 6)
              .map((lead) => {
                const meta = channelMeta[lead.channel];
                return (
                  <li key={lead.id}>
                    <Link
                      to={`/inbox/${lead.channel}`}
                      className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/40"
                    >
                      <Avatar name={lead.name} color={lead.avatarColor} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{lead.name}</p>
                          <span
                            className={cn(
                              "inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold uppercase tracking-wide",
                              meta.bg,
                              meta.color
                            )}
                          >
                            <ChannelIcon channel={lead.channel} className="h-2.5 w-2.5" />
                            {meta.label}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{lead.lastMessage}</p>
                      </div>
                      <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                        {formatRelative(lead.lastMessageAt)}
                      </div>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      </section>
    </div>
  );
}
