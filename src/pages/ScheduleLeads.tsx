import { useEffect, useState } from "react";
import { CalendarDays, Phone, User, Clock, RefreshCw, Inbox } from "lucide-react";

interface ScheduleEntry {
  _id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  createdAt: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ScheduleLeads() {
  const [leads, setLeads] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/schedule");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLeads(data);
    } catch {
      setError("Could not load schedule leads. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Schedule Leads</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {leads.length} site visit{leads.length !== 1 ? "s" : ""} booked
            </p>
          </div>
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-24 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">No visits scheduled yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Bookings from the Schedule page will appear here.</p>
        </div>
      )}

      {/* Table — desktop */}
      {!loading && leads.length > 0 && (
        <>
          <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">#</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Name</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Phone</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Date</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Time</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Booked On</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr
                    key={lead._id}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-4 text-muted-foreground">{i + 1}</td>
                    <td className="px-5 py-4 font-medium">{lead.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{lead.phone}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(lead.date)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Clock className="h-3 w-3" />
                        {lead.time}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="space-y-3 md:hidden">
            {leads.map((lead, i) => (
              <div key={lead._id} className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {lead.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {lead.phone}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(lead.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Clock className="h-3 w-3" />
                    {lead.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
