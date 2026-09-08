import { useEffect, useState } from "react";

export default function RiskGauge({ score, level }) {
  const [animated, setAnimated] = useState(0);
  const r = 86;
  const C = 2 * Math.PI * r;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const offset = C * (1 - animated / 100);
  const label = (level || "unknown").toUpperCase();

  return (
    <div className={`gauge risk-${level || "low"}`} role="img" aria-label={`Estimated risk ${score} out of 100, ${label}`}>
      <svg className="gauge-ring" width="200" height="200" viewBox="0 0 200 200">
        <circle className="gauge-track" cx="100" cy="100" r={r} strokeWidth="14" />
        <circle
          className="gauge-fill"
          cx="100"
          cy="100"
          r={r}
          strokeWidth="14"
          strokeDasharray={C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-center">
        <div className="gauge-score">{score}</div>
        <div className="gauge-max">/ 100</div>
      </div>
    </div>
  );
}
