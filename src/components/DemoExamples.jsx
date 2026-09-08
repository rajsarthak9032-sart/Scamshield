import {
  Package,
  Briefcase,
  Lock,
  Gift,
  MessageCircle,
  Coffee,
  Play,
} from "lucide-react";

const ICONS = { Package, Briefcase, Lock, Gift, MessageCircle, Coffee };

export default function DemoExamples({ demos, activeId, onSelect }) {
  return (
    <section className="demos" id="demo">
      <div className="demos-head">
        <span className="lbl">Try a fictional example — made for live demos</span>
        <span className="faint" style={{ fontSize: 12 }}>
          All examples are fictional
        </span>
      </div>
      <div className="demo-grid">
        {demos.map((d) => {
          const Icon = ICONS[d.icon] || Play;
          return (
            <button
              key={d.id}
              className={`demo-chip ${activeId === d.id ? "active" : ""}`}
              onClick={() => onSelect(d)}
            >
              <span className="demo-icon">
                <Icon size={18} />
              </span>
              <span className="demo-meta">
                <span className="cat">{d.cat}</span>
                <span className="ttl">{d.title}</span>
                <span className="desc">{d.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
