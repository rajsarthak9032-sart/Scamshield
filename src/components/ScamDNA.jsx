import { Dna } from "lucide-react";

const LABELS = [
  ["urgency", "Urgency"],
  ["impersonation", "Impersonation"],
  ["payment_request", "Payment Request"],
  ["credential_request", "Credential Request"],
  ["suspicious_link", "Suspicious Link"],
  ["social_engineering", "Social Engineering"],
];

function levelOf(v) {
  if (v >= 67) return "high";
  if (v >= 34) return "med";
  return "low";
}

export default function ScamDNA({ dna }) {
  const data = dna || {};
  return (
    <div className="panel panel-pad">
      <div className="card-title">
        <Dna size={18} className="ico" /> Scam DNA
      </div>
      {LABELS.map(([key, label]) => {
        const v = Math.max(0, Math.min(100, Number(data[key]) || 0));
        const lvl = levelOf(v);
        return (
          <div className="dna-row" key={key}>
            <span className="dna-name">{label}</span>
            <div
              className="dna-bar"
              role="meter"
              aria-valuenow={v}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label} ${v} percent`}
            >
              <div
                className={`dna-fill dna-${lvl}`}
                style={{ width: `${v}%` }}
              />
            </div>
            <span className="dna-val">{v}%</span>
          </div>
        );
      })}
      <p className="card-note">
        Scam DNA shows the manipulation patterns detected in this message. It is not a guarantee of
        fraud.
      </p>
    </div>
  );
}
