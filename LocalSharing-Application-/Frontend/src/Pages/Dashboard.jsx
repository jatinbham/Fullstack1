import { useState, useEffect } from "react";
import {
  Plus, Droplet, Truck, Pill, MapPin, Clock, TrendingUp,
  AlertTriangle, CheckCircle2, ArrowUpRight, HeartPulse,
  Activity, Award, Zap, User, LogOut, Loader
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5001";

// Design tokens
const COLOR = {
  primary: "#E5383B",
  primaryLight: "#fde8e8",
  secondary: "#6C63FF",
  secondaryLight: "#eeecff",
  success: "#22c55e",
  successLight: "#dcfce7",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  bg: "#0a0a0f",
  card: "rgba(255,255,255,.05)",
  border: "rgba(255,255,255,.18)",
  text: "#e8e8f0",
  muted: "#6b7280",
  gradHero: "linear-gradient(135deg, #E5383B 0%, #a21caf 100%)",
  gradCard: "linear-gradient(135deg, #6C63FF 0%, #E5383B 100%)",
};

const S = {
  shell: { minHeight: "100vh", background: COLOR.bg, fontFamily: "'Inter','Segoe UI',sans-serif", color: COLOR.text },
  header: {
    background: "rgba(10,10,15,.85)", backdropFilter: "blur(12px)",
    borderBottom: `1px solid ${COLOR.border}`, padding: "0 24px",
    height: 68, display: "flex", alignItems: "center",
    justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10,
  },
  logo: { fontWeight: 800, fontSize: 20, background: COLOR.gradHero, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.5px" },
  main: { maxWidth: 1200, margin: "0 auto", padding: "28px 20px 48px" },
  pageTitle: { fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 2 },
  pageSub: { fontSize: 13, color: COLOR.muted, marginBottom: 28 },
  card: (extra = {}) => ({ background: COLOR.card, border: `1px solid ${COLOR.border}`, borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.05)", ...extra }),
  btnSm: { padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${COLOR.border}`, background: "transparent", fontWeight: 500, fontSize: 12, cursor: "pointer", color: COLOR.text },
  tag: (bg, color) => ({ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: bg, color }),
  iconBox: (bg, size = 48, radius = 12) => ({ width: size, height: size, borderRadius: radius, background: bg, display: "grid", placeItems: "center", flexShrink: 0 }),
};

const CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#0a0a0f; font-family:'Inter','Segoe UI',sans-serif; color:#e8e8f0; overflow-x:hidden; }
@keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.55);opacity:0} }
@keyframes spin { to{transform:rotate(360deg)} }
`;
if (typeof document !== "undefined" && !document.getElementById("resq-dash-styles")) {
  const el = document.createElement("style");
  el.id = "resq-dash-styles";
  el.textContent = CSS;
  document.head.appendChild(el);
}

// Resource type → icon + color mapping
const typeMap = {
  Blood:     { icon: Droplet,  color: COLOR.primary,   bg: COLOR.primaryLight },
  Transport: { icon: Truck,    color: COLOR.warning,   bg: COLOR.warningLight },
  Medicine:  { icon: Pill,     color: COLOR.secondary, bg: COLOR.secondaryLight },
  Food:      { icon: Plus,     color: COLOR.success,   bg: COLOR.successLight },
  Shelter:   { icon: MapPin,   color: COLOR.muted,     bg: "rgba(255,255,255,.08)" },
};

const urgColor = { CRITICAL: "primary", HIGH: "warning", MEDIUM: "secondary", LOW: "success" };

function Badge({ color, label }) {
  const map = {
    primary:   { bg: COLOR.primary,   fg: "#fff" },
    warning:   { bg: COLOR.warning,   fg: "#fff" },
    success:   { bg: COLOR.success,   fg: "#fff" },
    secondary: { bg: COLOR.secondary, fg: "#fff" },
  };
  const c = map[color] || map.primary;
  return <span style={S.tag(c.bg, c.fg)}>{label}</span>;
}

function AlertRow({ color, title, sub }) {
  const accent = { primary: COLOR.primary, warning: COLOR.warning, success: COLOR.success }[color] || COLOR.muted;
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 3, borderRadius: 99, background: accent, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11, color: COLOR.muted, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

function Skeleton({ w = "100%", h = 18, radius = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: radius, background: "rgba(255,255,255,.07)", animation: "pulse-ring 1.4s ease-out infinite" }} />;
}

// ── Main Dashboard ──
export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const [user,     setUser]     = useState(null);
  const [requests, setRequests] = useState([]);
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState({ user: true, requests: true, alerts: true });
  const [error,    setError]    = useState({});

  const token = localStorage.getItem("token");

  // Redirect if not logged in
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // Fetch user profile
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
        return r.json();
      })
      .then(data => { if (data) setUser(data); })
      .catch(() => setError(e => ({ ...e, user: "Could not load profile" })))
      .finally(() => setLoading(l => ({ ...l, user: false })));
  }, [token, navigate]);

  // Fetch nearby requests
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setRequests(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setError(e => ({ ...e, requests: "Could not load requests" })))
      .finally(() => setLoading(l => ({ ...l, requests: false })));
  }, [token]);

  // Fetch alerts
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setAlerts(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => setError(e => ({ ...e, alerts: "Could not load alerts" })))
      .finally(() => setLoading(l => ({ ...l, alerts: false })));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Derive greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = user?.name || "...";
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "";

  // Static stats (can be wired to a /api/stats endpoint later)
  const stats = [
    { icon: Activity, label: "Lives assisted", value: "27",    delta: "+3 this week",    color: COLOR.primary,   bg: COLOR.primaryLight },
    { icon: Clock,    label: "Avg response",   value: "2m 41s", delta: "−18s vs last",   color: COLOR.secondary, bg: COLOR.secondaryLight },
    { icon: Award,    label: "Trust score",    value: "4.92",   delta: "Top 5% in city", color: COLOR.success,   bg: COLOR.successLight },
    { icon: Zap,      label: "Streak",         value: "12 days",delta: "Keep it up!",    color: COLOR.warning,   bg: COLOR.warningLight },
  ];

  const quickActions = [
    { icon: Droplet,       label: "Donate blood",  to: "/donate" },
    { icon: Plus,          label: "Request help",  to: "/request" },
    { icon: MapPin,        label: "Live map",      to: "/map" },
    { icon: CheckCircle2,  label: "My impact",     to: "/analytics" },
  ];

  // Alert color mapping by type
  const alertColorMap = { warning: "warning", info: "primary", success: "success" };

  return (
    <div style={S.shell}>
      {/* Header */}
      <header style={S.header}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <span style={S.logo}>ResQ Link</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {loading.user
            ? <Skeleton w={120} h={32} radius={10} />
            : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ ...S.iconBox("rgba(229,56,59,.15)", 36, 10) }}>
                  <User size={16} color={COLOR.primary} />
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: COLOR.muted }}>{displayRole}</div>
                </div>
              </div>
            )
          }
          <button
            onClick={handleLogout}
            style={{ ...S.btnSm, display: "flex", alignItems: "center", gap: 6 }}
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={S.main}>
        {/* Page title */}
        <div style={S.pageTitle}>
          {loading.user
            ? <Skeleton w={280} h={28} />
            : `${greeting}, ${displayName.split(" ")[0]}`
          }
        </div>
        <div style={S.pageSub}>
          {loading.requests
            ? <Skeleton w={220} h={14} />
            : `${requests.length} active requests near you · 12 verified responders online`
          }
        </div>

        {/* Hero row */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16, marginBottom: 20 }}>
          {/* Community status */}
          <div style={{ borderRadius: 24, padding: "36px 32px", background: COLOR.gradHero, color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(229,56,59,.35)" }}>
            <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,.1)", filter: "blur(40px)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, opacity: .9, marginBottom: 12 }}>
                <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fff", animation: "pulse-ring 1.4s ease-out infinite" }} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />
                </span>
                LIVE · COMMUNITY STATUS
              </div>
              <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.2, margin: 0 }}>
                Your neighborhood is stable.
              </h2>
              <p style={{ marginTop: 8, opacity: .9, fontSize: 14, maxWidth: 380 }}>
                No critical alerts within 5 km. 248 donors and 42 shelters are available right now.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 24, maxWidth: 340 }}>
                {[{ v: "248", l: "Donors" }, { v: "42", l: "Shelters" }, { v: "<3m", l: "Avg ETA" }].map(s => (
                  <div key={s.l} style={{ borderRadius: 14, background: "rgba(255,255,255,.13)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.18)", padding: "12px 14px" }}>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{s.v}</div>
                    <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SOS */}
          <div style={{ ...S.card(), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ position: "relative", width: 120, height: 120, cursor: "pointer" }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `${COLOR.primary}50`, animation: "pulse-ring 1.6s ease-out infinite" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: COLOR.gradHero, display: "grid", placeItems: "center", boxShadow: `0 0 32px ${COLOR.primary}80` }}>
                <HeartPulse size={40} color="#fff" />
              </div>
            </div>
            <div style={{ marginTop: 20, fontSize: 18, fontWeight: 800 }}>Press for SOS</div>
            <p style={{ fontSize: 12, color: COLOR.muted, marginTop: 6, maxWidth: 200, lineHeight: 1.5 }}>
              Sends live location to your 3 trusted contacts and the nearest first-responders.
            </p>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={S.card()}>
              <div style={S.iconBox(s.bg)}><s.icon size={20} color={s.color} /></div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 14 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: COLOR.success, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <TrendingUp size={12} /> {s.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom grid */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16 }}>

          {/* Active requests — LIVE from backend */}
          <div style={S.card()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Active requests near you</h3>
              <Link to="/map" style={{ fontSize: 12, color: COLOR.primary, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                Open map <ArrowUpRight size={12} />
              </Link>
            </div>

            {loading.requests ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} h={72} radius={14} />)}
              </div>
            ) : error.requests ? (
              <div style={{ color: COLOR.primary, fontSize: 13, padding: "16px 0" }}>{error.requests}</div>
            ) : requests.length === 0 ? (
              <div style={{ color: COLOR.muted, fontSize: 13, padding: "24px 0", textAlign: "center" }}>
                No active requests right now. Check back soon.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {requests.map(r => {
                  const type = typeMap[r.resourceType] || typeMap["Blood"];
                  const Icon = type.icon;
                  const urg = r.urgency?.toUpperCase() || "MEDIUM";
                  return (
                    <div key={r._id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, background: COLOR.bg, border: `1px solid ${COLOR.border}` }}>
                      <div style={S.iconBox(type.bg)}>
                        <Icon size={22} color={type.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{r.title || r.resourceType}</span>
                          <Badge color={urgColor[urg] || "secondary"} label={urg} />
                        </div>
                        <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 3 }}>
                          {r.requesterName || r.location || "Unknown"} · {r.distance ? `${r.distance} km` : ""} · {r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                      <button style={S.btnSm}>Accept</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Volunteer status */}
            <div style={S.card()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Your status</h3>
                <span style={S.tag(COLOR.successLight, COLOR.success)}>
                  {loading.user ? "..." : displayRole.toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR.success, display: "inline-block" }} />
                {loading.user ? <Skeleton w={160} h={14} /> : `Active · ${user?.location || "Location not set"}`}
              </div>
              <div style={{ marginTop: 16, height: 6, background: COLOR.border, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "68%", background: COLOR.gradHero, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 8 }}>
                68% to next badge: <span style={{ color: COLOR.text, fontWeight: 600 }}>First Responder Gold</span>
              </div>
            </div>

            {/* Emergency alerts — LIVE from backend */}
            <div style={S.card()}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={16} color={COLOR.warning} />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Emergency alerts</h3>
              </div>

              {loading.alerts ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[1, 2, 3].map(i => <Skeleton key={i} h={36} radius={8} />)}
                </div>
              ) : error.alerts ? (
                <div style={{ color: COLOR.primary, fontSize: 13 }}>{error.alerts}</div>
              ) : alerts.length === 0 ? (
                <div style={{ color: COLOR.muted, fontSize: 13 }}>No active alerts in your area.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {alerts.map(a => (
                    <AlertRow
                      key={a._id}
                      color={alertColorMap[a.type] || "warning"}
                      title={a.title}
                      sub={`${a.location || ""} · ${a.time || (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "")}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginTop: 20 }}>
          {quickActions.map(q => (
            <Link key={q.label} to={q.to} style={{ ...S.card({ padding: 16 }), display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: COLOR.text, transition: "box-shadow .2s, transform .2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.05)"; e.currentTarget.style.transform = "none"; }}
            >
              <span style={{ ...S.iconBox(COLOR.gradHero, 40, 10), background: COLOR.gradHero }}>
                <q.icon size={18} color="#fff" />
              </span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{q.label}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}