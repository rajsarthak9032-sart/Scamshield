import { Activity } from "lucide-react";

const ROWS = [
  { label: "Message patterns", state: "scanning", cls: "state-scanning" },
  { label: "Urgency language", state: "detected", cls: "state-detected" },
  { label: "Link context", state: "ready", cls: "state-ready" },
  { label: "Evidence mapping", state: "ready", cls: "state-ready" },
];

export default function ThreatSignalMonitor() {
  return (
    <div className="panel monitor">
      <div className="monitor-head">
        <span className="monitor-title">Signal Monitor</span>
        <span className="monitor-dot" aria-hidden="true" />
      </div>

      <div className="monitor-grid">
        {ROWS.map((r) => (
          <div className="monitor-row" key={r.label}>
            <span className="monitor-label">{r.label}</span>
            <span className={`monitor-state ${r.cls}`}>{r.state}</span>
          </div>
        ))}
      </div>

      <div className="radar" aria-hidden="true">
        <div className="radar-sweep" />
      </div>

      <p className="faint" style={{ fontSize: 12, marginTop: 14, textAlign: "center" }}>
        <Activity size={12} style={{ verticalAlign: "middle" }} /> Live analysis begins when you
        submit a message.
      </p>
    </div>
  );
}
