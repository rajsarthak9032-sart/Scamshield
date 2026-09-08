import { Brain, FileSearch, ShieldCheck } from "lucide-react";

const BADGES = [
  { icon: Brain, label: "Explainable AI" },
  { icon: FileSearch, label: "Evidence-first analysis" },
  { icon: ShieldCheck, label: "Privacy-conscious design" },
];

export default function TrustBadges() {
  return (
    <div className="badges">
      {BADGES.map(({ icon: Icon, label }) => (
        <span className="badge" key={label}>
          <Icon size={15} />
          {label}
        </span>
      ))}
    </div>
  );
}
