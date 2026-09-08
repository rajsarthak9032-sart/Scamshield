import { ClipboardPaste, ScanLine, Lightbulb, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardPaste,
    title: "Paste",
    text: "Drop in any suspicious email, SMS, DM, job offer, or delivery message.",
  },
  {
    icon: ScanLine,
    title: "Analyze",
    text: "ScamShield's pattern and rule-based engine maps urgency, impersonation, payment, and more.",
  },
  {
    icon: Lightbulb,
    title: "Understand",
    text: "See exactly which phrases triggered each signal, with plain-language explanations.",
  },
  {
    icon: ShieldCheck,
    title: "Verify safely",
    text: "Get calm, actionable steps and verify important claims through official channels.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section" id="how">
      <h2 className="section-title">How it works</h2>
      <p className="section-sub">
        ScamShield turns a scary message into a clear, evidence-backed report in four steps.
      </p>
      <div className="steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div className="panel panel-pad step" key={s.title}>
              <div className="step-num">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          );
        })}
      </div>
      <div className="privacy-box" style={{ marginTop: 26 }}>
        <ShieldCheck size={18} style={{ flex: "0 0 auto", marginTop: 2 }} />
        <span>
          ScamShield uses AI and rule-based signals to explain suspicious communication patterns. It
          cannot guarantee that a message is legitimate or fraudulent. Always verify important
          claims independently.
        </span>
      </div>
    </section>
  );
}
