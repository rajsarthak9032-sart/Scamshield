import { Link as LinkIcon, ShieldAlert } from "lucide-react";

export default function LinksDetected({ links }) {
  const list = links || [];
  if (list.length === 0) return null;
  return (
    <div className="panel panel-pad link-panel">
      <div className="card-title" style={{ color: "var(--red)" }}>
        <LinkIcon size={18} /> Links detected
      </div>
      {list.map((l, i) => (
        <div className="link-item" key={i}>
          {l}
        </div>
      ))}
      <p className="card-note" style={{ color: "#ffc2c7" }}>
        ScamShield does not visit or verify these links automatically.
      </p>
    </div>
  );
}
