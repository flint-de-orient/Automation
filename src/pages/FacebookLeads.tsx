import { useEffect, useState } from "react";
import { Search, Phone, User } from "lucide-react";

const SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/1S7rMH47G-xJn7xAuzmI9rIxpA1C3WWEWotEIfaoUwM0/export?format=csv";

interface Lead {
  name: string;
  phone: string;
}

function parseCSV(csv: string): Lead[] {
  // Tokenize properly — handles quoted fields with embedded newlines
  const tokens: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuote = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    const next = csv[i + 1];

    if (ch === '"') {
      if (inQuote && next === '"') { cell += '"'; i++; } // escaped quote
      else { inQuote = !inQuote; }
    } else if (ch === "," && !inQuote) {
      row.push(cell.trim());
      cell = "";
    } else if ((ch === "\n" || (ch === "\r" && next === "\n")) && !inQuote) {
      if (ch === "\r") i++;
      row.push(cell.trim());
      tokens.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) { row.push(cell.trim()); tokens.push(row); }

  if (tokens.length < 2) return [];

  const headers = tokens[0].map((h) => h.toLowerCase().trim());
  const nameIdx  = headers.indexOf("name");
  const phoneIdx = headers.indexOf("phone");

  if (nameIdx === -1 || phoneIdx === -1) return [];

  return tokens
    .slice(1)
    .map((cols) => ({
      name:  (cols[nameIdx]  ?? "").split("\n")[0].trim(),
      phone: (cols[phoneIdx] ?? "").trim(),
    }))
    .filter((l) => l.name || l.phone);
}

const avatarColors = [
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-indigo-400 to-indigo-600",
  "from-cyan-400 to-cyan-600",
];

export default function FacebookLeads() {
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch(SHEET_CSV)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch sheet");
        return r.text();
      })
      .then((csv) => setLeads(parseCSV(csv)))
      .catch(() => setError("Could not load leads. Make sure the sheet is publicly accessible."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.phone.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facebook Leads</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} lead${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Loading leads…
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {/* Leads grid */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No leads found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((lead, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${avatarColors[i % avatarColors.length]}`}
                  >
                    {lead.name ? lead.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {lead.name || "—"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{lead.phone || "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
