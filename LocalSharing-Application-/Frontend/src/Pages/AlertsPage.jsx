import { useState } from "react";

const alerts = [
  {
    sev: "critical",
    emoji: "🌊",
    title: "Flash flood warning — Yamuna basin",
    area: "Delhi NCR · 12 wards",
    time: "Active · updated 4 min ago",
    desc: "Water levels at 207.5m. Residents in low-lying zones must evacuate to designated shelters.",
    need: "Boats, dry rations, blankets",
    category: "Disaster",
  },
  {
    sev: "high",
    emoji: "⛈️",
    title: "Severe thunderstorm + hail",
    area: "Sector 22-32, Noida",
    time: "Next 6 hours",
    desc: "Wind gusts up to 80 km/h expected. Avoid travel and secure outdoor objects.",
    need: "Shelter capacity",
    category: "Weather",
  },
  {
    sev: "high",
    emoji: "🔥",
    title: "Building fire — Karol Bagh",
    area: "Rd No 14 · Block C",
    time: "Ongoing · 1h 12m",
    desc: "Fire services on site. Residents within 200m advised to evacuate.",
    need: "Medical aid, water, transport",
    category: "Disaster",
  },
  {
    sev: "medium",
    emoji: "🚗",
    title: "Major accident · NH-48",
    area: "KM 28 near Gurugram",
    time: "32 min ago",
    desc: "8 injured, 2 critical. O+ and O- blood needed at Medanta Hospital.",
    need: "Blood (O+, O-), ambulance",
    category: "Medical",
  },
  {
    sev: "medium",
    emoji: "⛰️",
    title: "Landslide risk advisory",
    area: "Manali–Leh highway",
    time: "Next 24 hours",
    desc: "Heavy rainfall forecast. Travelers advised to postpone non-essential travel.",
    need: "Information",
    category: "Weather",
  },
];

const sevConfig = {
  critical: {
    label: "CRITICAL",
    chipBg: "#e53e3e",
    chipColor: "#fff",
    border: "rgba(229,62,62,0.4)",
    iconBg: "rgba(229,62,62,0.15)",
  },
  high: {
    label: "HIGH",
    chipBg: "#d69e2e",
    chipColor: "#fff",
    border: "rgba(214,158,46,0.35)",
    iconBg: "rgba(214,158,46,0.12)",
  },
  medium: {
    label: "MEDIUM",
    chipBg: "#6366f1",
    chipColor: "#fff",
    border: "rgba(99,102,241,0.3)",
    iconBg: "rgba(99,102,241,0.12)",
  },
};

const filterTabs = ["All alerts", "Critical", "Weather", "Medical", "Disaster", "Traffic"];

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState("All alerts");
  const [markedSafe, setMarkedSafe] = useState(false);

  // User Alert Workflow States
  const [alertName, setAlertName] = useState("");
  const [alertLocation, setAlertLocation] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertResponse, setAlertResponse] = useState(null);
  const [alertError, setAlertError] = useState("");

  const handleTriggerAlert = async (e) => {
    e.preventDefault();
    if (!alertName || !alertLocation) return;
    setAlertLoading(true);
    setAlertError("");
    setAlertResponse(null);

    try {
      const res = await fetch("http://localhost:5001/api/alerts/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: alertName, location: alertLocation }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to trigger alert");
      }
      setAlertResponse(data.responseInterface);
      setAlertName("");
      setAlertLocation("");
    } catch (err) {
      console.error(err);
      setAlertError(err.message || "Something went wrong.");
    } finally {
      setAlertLoading(false);
    }
  };

  const filtered = alerts.filter(a => {
    if (activeFilter === "All alerts") return true;
    if (activeFilter === "Critical") return a.sev === "critical";
    return a.category === activeFilter;
  });

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#0a0a0f", color: "#e8e8f0", minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); }
        .glass-strong { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); }
        .filter-btn { transition: background 0.15s, color 0.15s; cursor: pointer; border: none; white-space: nowrap; }
        .filter-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .alert-card { transition: transform 0.15s; }
        .alert-card:hover { transform: translateY(-2px); }
        .action-btn { transition: background 0.15s, opacity 0.15s; cursor: pointer; border: none; }
        .action-btn:hover { opacity: 0.85; }
        .detail-btn { transition: background 0.15s; cursor: pointer; border: none; }
        .detail-btn:hover { background: rgba(245,101,101,0.1) !important; }
        .filter-scroll::-webkit-scrollbar { display: none; }
        @keyframes pulse-banner {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .pulse-dot { animation: pulse-banner 2s ease-in-out infinite; }
        @media (max-width: 600px) {
          .banner-btns { flex-direction: column !important; }
          .banner-btns button { width: 100%; justify-content: center; }
          .alert-row { flex-direction: column !important; }
          .alert-icon { display: none !important; }
        }
      `}</style>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "84px 24px 60px" }}>

        {/* Page title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 7, }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Emergency Alert Center</h1>
            <p style={{ fontSize: 13, color: "rgba(232,232,240,0.45)", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#f56565", display: "inline-block" }} />
              5 active alerts in your region · last sync 12 seconds ago
            </p>
          </div>
        </div>

        {/* User Alert Workflow Form */}
        <div className="glass-strong" style={{ borderRadius: 24, padding: 24, marginBottom: 24, background: "rgba(255,255,255,0.02)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#fff" }}>📢 Send Instant Location Alert</h3>
          <p style={{ fontSize: 13, color: "rgba(232,232,240,0.5)", marginBottom: 16 }}>
            Report an emergency event or trigger matching services in your area. This will notify volunteers.
          </p>
          <form onSubmit={handleTriggerAlert} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <input
              type="text"
              placeholder="Your Name"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              style={{
                flex: "1 1 200px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "#fff",
                padding: "10px 14px",
                fontSize: 14,
                outline: "none"
              }}
              required
            />
            <input
              type="text"
              placeholder="Your Location (e.g. Gurugram, Sector 15)"
              value={alertLocation}
              onChange={(e) => setAlertLocation(e.target.value)}
              style={{
                flex: "2 1 300px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "#fff",
                padding: "10px 14px",
                fontSize: 14,
                outline: "none"
              }}
              required
            />
            <button
              type="submit"
              disabled={alertLoading}
              style={{
                background: "linear-gradient(135deg, #e53e3e, #c53030)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                padding: "10px 24px",
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
            >
              {alertLoading ? "Triggering..." : "Submit Alert"}
            </button>
          </form>

          {alertError && (
            <div style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>
              ⚠️ {alertError}
            </div>
          )}

          {alertResponse && (
            <div style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 16,
              background: "rgba(239,62,62,0.08)",
              border: "1px solid rgba(229,62,62,0.25)"
            }}>
              <h4 style={{ color: "#f87171", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                🚨 {alertResponse.header}
              </h4>
              <ul style={{ fontSize: 13, color: "rgba(232,232,240,0.85)", listStyleType: "none", paddingLeft: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <li><strong>Status:</strong> Broadcast active (Reach: {alertResponse.broadcastReach})</li>
                <li><strong>Severity:</strong> {alertResponse.severity.toUpperCase()}</li>
                <li><strong>Responders Dispatched:</strong> {alertResponse.respondersDispatched}</li>
                <li><strong>Safe Shelter:</strong> {alertResponse.safetyShelter}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Critical Banner */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, padding: "28px 28px", background: "linear-gradient(135deg, #e53e3e, #c53030, #9f1239)", marginBottom: 20 }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.08)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.15)", display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0 }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.9, letterSpacing: 2, marginBottom: 4 }}>CRITICAL · L1</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>Flash flood warning in your area</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, maxWidth: 540 }}>
                Yamuna river crossed danger mark. 12 wards under evacuation. Nearest safe shelter: Civil Lines Community Hall (1.8 km).
              </p>
              <div className="banner-btns" style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button className="action-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "#fff", color: "#c53030", fontWeight: 700, fontSize: 13 }}>
                  📍 Navigate to shelter
                </button>
                <button
                  className="action-btn"
                  onClick={() => setMarkedSafe(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: markedSafe ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 13, border: "1px solid rgba(255,255,255,0.35)" }}
                >
                  {markedSafe ? "✅ Marked safe" : "Mark me safe"}
                </button>
                <button className="action-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 600, fontSize: 13, border: "1px solid rgba(255,255,255,0.3)" }}>
                  👥 Volunteer help
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="filter-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
          {filterTabs.map(tab => (
            <button
              key={tab}
              className="filter-btn"
              onClick={() => setActiveFilter(tab)}
              style={{
                padding: "7px 16px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: activeFilter === tab ? "#e8e8f0" : "rgba(255,255,255,0.06)",
                color: activeFilter === tab ? "#0a0a0f" : "rgba(232,232,240,0.65)",
                border: activeFilter === tab ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}
            >{tab}</button>
          ))}
        </div>

        {/* Alert list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 14, color: "rgba(232,232,240,0.35)" }}>No alerts in this category</div>
          )}
          {filtered.map(a => {
            const cfg = sevConfig[a.sev];
            return (
              <div
                key={a.title}
                className="alert-card glass-strong"
                style={{ borderRadius: 20, padding: 20, border: `1px solid ${cfg.border}` }}
              >
                <div className="alert-row" style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  {/* Icon */}
                  <div className="alert-icon" style={{ width: 48, height: 48, borderRadius: 14, background: cfg.iconBg, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
                    {a.emoji}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: cfg.chipBg, color: cfg.chipColor, letterSpacing: 0.5 }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(232,232,240,0.45)", display: "flex", alignItems: "center", gap: 4 }}>
                        🕐 {a.time}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>{a.title}</h3>
                    <div style={{ fontSize: 11, color: "rgba(232,232,240,0.45)", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                      📍 {a.area}
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(232,232,240,0.6)", lineHeight: 1.6 }}>{a.desc}</p>
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: "rgba(232,232,240,0.45)" }}>Resources needed: </span>
                        <span style={{ fontWeight: 600 }}>{a.need}</span>
                      </div>
                      <button className="detail-btn" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#f56565", padding: "5px 10px", borderRadius: 8, background: "transparent" }}>
                        View details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
