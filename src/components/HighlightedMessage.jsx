import { Highlighter } from "lucide-react";

export default function HighlightedMessage({ message, signals }) {
  const evidences = (signals || [])
    .filter((s) => s.evidence && s.evidence.trim())
    .map((s) => ({ ev: s.evidence.trim(), name: s.name || "Suspicious signal" }))
    .filter((e) => e.ev.length > 0 && message && message.includes(e.ev));

  const segments = [];
  if (message) {
    let i = 0;
    const n = message.length;
    while (i < n) {
      let best = null;
      for (const e of evidences) {
        if (message.startsWith(e.ev, i)) {
          if (!best || e.ev.length > best.ev.length) best = e;
        }
      }
      if (best) {
        segments.push({ text: best.ev, label: best.name, hl: true });
        i += best.ev.length;
      } else {
        let j = i + 1;
        let found = false;
        while (j <= n) {
          let any = false;
          for (const e of evidences) {
            if (j + e.ev.length <= n && message.startsWith(e.ev, j)) {
              any = true;
              break;
            }
          }
          if (any) {
            found = true;
            break;
          }
          j++;
        }
        segments.push({ text: message.slice(i, found ? j : n), hl: false });
        i = found ? j : n;
      }
    }
  }

  return (
    <div className="panel panel-pad">
      <div className="card-title">
        <Highlighter size={18} className="ico" /> Analyzed message
      </div>
      <div className="forensic">
        {segments.map((seg, idx) =>
          seg.hl ? (
            <mark className="hl" data-label={seg.label} key={idx} title={seg.label}>
              {seg.text}
            </mark>
          ) : (
            <span key={idx}>{seg.text}</span>
          )
        )}
      </div>
      <p className="card-note">
        Highlighted phrases are exact quotes pulled from the message above. Hover a highlight to see
        the signal it matched.
      </p>
    </div>
  );
}
