import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

const SEV_ICON = {
  high: AlertTriangle,
  medium: ShieldAlert,
  low: Info,
};

export default function SignalCard({ signal }) {
  const s = signal || {};
  const sev = s.severity || "low";
  const Icon = SEV_ICON[sev] || Info;
  return (
    <div className={`signal-card sev-${sev}`}>
      <div className="signal-head">
        <span className="signal-name">
          <Icon size={16} className="ico" />
          {s.name || "Suspicious signal"}
        </span>
        <span className={`sev sev-${sev}`}>{sev}</span>
      </div>
      {s.evidence ? (
        <div className="signal-evidence">“{s.evidence}”</div>
      ) : null}
      <div className="signal-expl">{s.explanation || ""}</div>
    </div>
  );
}
