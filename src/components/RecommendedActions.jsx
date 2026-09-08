import { CheckCircle2, ListChecks } from "lucide-react";

export default function RecommendedActions({ actions }) {
  const list = actions || [];
  return (
    <div className="panel panel-pad">
      <div className="card-title">
        <ListChecks size={18} className="ico" /> What should you do?
      </div>
      {list.length === 0 ? (
        <p className="muted">No specific actions were suggested.</p>
      ) : (
        <div className="actions">
          {list.map((a, i) => (
            <div className="action" key={i}>
              <span className="num">{i + 1}</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}
      <p className="card-note" style={{ color: "var(--emerald)" }}>
        <CheckCircle2 size={13} style={{ verticalAlign: "middle" }} /> Never interact with
        suspicious links or share credentials.
      </p>
    </div>
  );
}
