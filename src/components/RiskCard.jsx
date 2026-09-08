import { ShieldCheck } from "lucide-react";
import RiskGauge from "./RiskGauge.jsx";

const LEVEL_TEXT = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function RiskCard({ analysis, message }) {
  const a = analysis || {};
  const level = a.risk_level || "low";
  const score = typeof a.risk_score === "number" ? a.risk_score : 0;

  return (
    <div className={`panel panel-pad risk-${level}`}>
      <div className="card-title">
        <ShieldCheck size={18} className="ico" /> Estimated risk
      </div>
      <div className="risk-wrap">
        <RiskGauge score={score} level={level} />
        <div className="risk-meta">
          <div className="risk-level">
            <span className="risk-dot" aria-hidden="true" />
            {LEVEL_TEXT[level] || "Unknown"}
            <span className="faint" style={{ fontWeight: 400, fontSize: 14 }}>
              ({score}/100)
            </span>
          </div>
          <div className="risk-meta">
            <div className="row scam-type">
              <b>Scam type:</b> {a.scam_type || "Unspecified"}
            </div>
          </div>
          <div className="summary">{a.summary || "No summary provided."}</div>
          <div className="model-attrib">
            {(a.uncertainty || "").includes("AI-assisted estimate")
              ? "Qwen3-30B-A3B-Instruct-2507 + ScamShield Pattern Checks"
              : "ScamShield Pattern Checks (rule-based fallback)"}
          </div>
          <p className="card-note">
            This analysis is probabilistic and should not replace independent verification.
          </p>
        </div>
      </div>
    </div>
  );
}
