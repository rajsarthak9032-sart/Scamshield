import { useEffect, useState } from "react";
import { ScanLine, FileText, MapPin, Sparkles, Check } from "lucide-react";

const STAGES = [
  { label: "Reading message", icon: FileText },
  { label: "Checking patterns", icon: ScanLine },
  { label: "Mapping evidence", icon: MapPin },
  { label: "Preparing explanation", icon: Sparkles },
];

export default function AnalysisLoading() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STAGES.length);
    }, 850);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="panel panel-pad loading reveal">
      <div className="loading-title">Analyzing message…</div>
      <div className="loading-sub">
        ScamShield is mapping signals and preparing an explainable report.
      </div>
      <div className="loading-stages">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const state = i < active ? "done" : i === active ? "active" : "";
          return (
            <div className={`stage ${state}`} key={s.label}>
              <span className="stage-ico">
                {i < active ? <Check size={16} /> : <Icon size={16} />}
              </span>
              {s.label}
            </div>
          );
        })}
      </div>
      <div className="scanbar" aria-hidden="true" />
    </div>
  );
}
