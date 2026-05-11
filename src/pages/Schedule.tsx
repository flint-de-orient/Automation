import { useState } from "react";
import { User, Phone, Calendar, Clock, ArrowRight, MapPin, Star, CheckCircle } from "lucide-react";
import { API_URL } from "@/lib/api";

const GOLD = "#c9a227";
const GOLD_GLOW = "rgba(201,162,39,0.18)";

function Field({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  required = true,
}: {
  icon: React.ElementType;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <Icon
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: GOLD }}
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium text-gray-800 outline-none transition-all"
        style={{
          border: `1.5px solid ${focused ? GOLD : "#e5e7eb"}`,
          background: "#f9fafb",
          boxShadow: focused ? `0 0 0 3px ${GOLD_GLOW}` : "none",
        }}
      />
    </div>
  );
}

export default function Schedule() {
  const [form, setForm] = useState({ name: "", mobile: "", date: "", time: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const formatTime12h = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.mobile,
          date: form.date,
          time: formatTime12h(form.time),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSubmitted(true);
      setForm({ name: "", mobile: "", date: "", time: "" });
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1530 40%, #0a1628 70%, #060d1a 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`, opacity: 0.08 }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #1a3a6e 0%, transparent 70%)", opacity: 0.12 }}
      />

      {/* Building silhouettes */}
      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        viewBox="0 0 1440 280"
        preserveAspectRatio="none"
        style={{ height: 220, opacity: 0.09 }}
      >
        {[
          [0,120,60,160],[70,160,80,120],[160,100,50,180],[220,130,90,150],
          [320,80,40,200],[370,150,70,130],[450,60,55,220],[515,130,85,150],
          [610,90,45,190],[665,155,75,125],[750,70,50,210],[810,115,90,165],
          [910,85,55,195],[975,145,70,135],[1055,65,45,215],[1110,110,80,170],
          [1200,80,50,200],[1260,150,85,130],[1355,95,85,185],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill={i % 2 === 0 ? GOLD : "#1a3a6e"} />
        ))}
      </svg>

      {/* Stars */}
      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: (i % 3) + 1 + "px",
            height: (i % 3) + 1 + "px",
            top: ((i * 37) % 65) + "%",
            left: ((i * 43) % 100) + "%",
            opacity: 0.08 + (i % 5) * 0.05,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-7">

        {/* Badge */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ border: `1px solid rgba(201,162,39,0.35)`, background: "rgba(201,162,39,0.07)", color: GOLD }}
        >
          <Star className="w-3 h-3 fill-current" />
          Premium Real Estate
          <Star className="w-3 h-3 fill-current" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none select-none">
            <span style={{ color: "#ffffff" }}>EASY </span>
            <span
              style={{
                background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              MAKAN
            </span>
          </h1>
          <p className="mt-3 text-base sm:text-lg font-light tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
            Find Your Dream Property With Ease
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8">
          {[["500+", "Properties"], ["98%", "Satisfaction"], ["10+", "Years"]].map(([val, label]) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold" style={{ color: GOLD }}>{val}</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="w-full rounded-3xl p-8 sm:p-10"
          style={{
            background: "rgba(255,255,255,0.97)",
            boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,162,39,0.12), inset 0 1px 0 rgba(255,255,255,0.9)`,
          }}
        >
          {/* Card header */}
          <div className="flex items-start gap-3 mb-7">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #f0d060)` }}
            >
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Book Your Site Visit</h2>
              <p className="text-sm mt-0.5 text-gray-500">
                Fill the form &amp; our expert will reach out shortly.
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <CheckCircle className="w-14 h-14" style={{ color: GOLD }} />
              <p className="text-lg font-semibold text-gray-800">Visit Scheduled!</p>
              <p className="text-sm text-gray-400 text-center">Our expert will contact you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field icon={User} type="text" placeholder="Your Full Name" value={form.name} onChange={set("name")} />
              <Field icon={Phone} type="tel" placeholder="Mobile Number" value={form.mobile} onChange={set("mobile")} />
              <div className="grid grid-cols-2 gap-3">
                <Field icon={Calendar} type="date" placeholder="" value={form.date} onChange={set("date")} />
                <Field icon={Clock} type="time" placeholder="" value={form.time} onChange={set("time")} />
              </div>

              {error && (
                <p className="text-xs text-red-500 text-center -mt-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
                style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, #f0d060 50%, ${GOLD} 100%)`,
                  color: "#0a0f1e",
                  boxShadow: "0 8px 30px rgba(201,162,39,0.4)",
                }}
              >
                {loading ? "Saving…" : (<>Schedule Visit <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>
          )}

          {/* Trust badges */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-5 flex-wrap">
            {["Verified Listings", "Expert Agents", "Free Consultation"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <CheckCircle className="w-3.5 h-3.5" style={{ color: GOLD }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2025 Easy Makan. All rights reserved.
        </p>
      </div>
    </div>
  );
}
