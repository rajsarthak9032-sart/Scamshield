import { ShieldCheck, Sparkles, Microscope, Lock } from "lucide-react";
import TrustBadges from "./TrustBadges.jsx";
import ThreatSignalMonitor from "./ThreatSignalMonitor.jsx";
import MessageInput from "./MessageInput.jsx";

export default function HeroSection({ message, setMessage, onAnalyze, maxLen }) {
  return (
    <section className="hero" id="top">
      <div className="hero-grid">
        <div className="reveal">
          <div className="brand-mark" style={{ marginBottom: 18 }}>
            <ShieldCheck size={20} />
          </div>
          <div className="eyebrow">Explainable scam intelligence</div>
          <h1>
            Understand suspicious messages <span className="grad">before you act.</span>
          </h1>
          <p className="hero-lead">
            ScamShield shows you exactly how a message tries to manipulate you — urgency, impersonation,
            payment pressure and more — using transparent, explainable pattern checks.
          </p>

          <MessageInput
            message={message}
            setMessage={setMessage}
            onAnalyze={onAnalyze}
            maxLen={maxLen}
          />

          <TrustBadges />
        </div>

        <div className="reveal">
          <ThreatSignalMonitor />
        </div>
      </div>
    </section>
  );
}

export { ShieldCheck, Sparkles, Microscope, Lock };
