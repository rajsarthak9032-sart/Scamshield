import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldCheck, ArrowLeft, Copy, RotateCcw, AlertTriangle } from "lucide-react";

import Header from "./components/Header.jsx";
import HeroSection from "./components/HeroSection.jsx";
import MessageInput from "./components/MessageInput.jsx";
import DemoExamples from "./components/DemoExamples.jsx";
import AnalysisLoading from "./components/AnalysisLoading.jsx";
import RiskCard from "./components/RiskCard.jsx";
import ScamDNA from "./components/ScamDNA.jsx";
import HighlightedMessage from "./components/HighlightedMessage.jsx";
import SignalCard from "./components/SignalCard.jsx";
import DeterministicFindings from "./components/DeterministicFindings.jsx";
import LinksDetected from "./components/LinksDetected.jsx";
import RecommendedActions from "./components/RecommendedActions.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import Footer from "./components/Footer.jsx";
import { analyzeMessage } from "./api.js";

const MAX_LEN = 8000;
const MIN_LOADING_MS = 1800;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEMOS = [
  {
    id: "delivery",
    icon: "Package",
    cat: "Delivery",
    title: "Missed package",
    desc: "A courier asks for a redelivery fee via a link.",
    text: "Your parcel could not be delivered. Pay a £1.20 redelivery fee to reschedule: http://parcel-reschedule-info.com/uk. If the fee is not paid within 24 hours your package will be returned to sender and destroyed.",
  },
  {
    id: "job",
    icon: "Briefcase",
    cat: "Job offer",
    title: "Remote job offer",
    desc: "Easy money, but asks for a training fee.",
    text: "Congratulations! You have been selected for a remote Data Entry position paying $4,500/month. To begin onboarding, please pay a one-time $60 training kit fee via PayPal and send us your ID and bank details for payroll setup.",
  },
  {
    id: "account",
    icon: "Lock",
    cat: "Account",
    title: "Account locked",
    desc: "Bank impersonation urging verification.",
    text: "Chase Security: Your account has been temporarily locked due to unusual sign-in activity. Verify your identity now to avoid permanent suspension: https://chase-secure-verify.com. Enter your password and the code we just texted you.",
  },
  {
    id: "prize",
    icon: "Gift",
    cat: "Prize",
    title: "You won!",
    desc: "Lottery win requiring a claim fee.",
    text: "WINNER! You have won a £1,000 Amazon voucher in our quarterly draw. Claim your prize today by clicking the link and paying a small £2 processing fee with your gift card code. This offer expires in 2 hours!",
  },
  {
    id: "dm",
    icon: "MessageCircle",
    cat: "Social DM",
    title: "Suspicious DM",
    desc: "A stranger offers crypto investment tips.",
    text: "hey! i saw your posts, you seem smart. i made $12k last week with this crypto signal group, only a small deposit to join. dm me and i'll show you the wallet address, spots are almost full so act fast",
  },
  {
    id: "benign",
    icon: "Coffee",
    cat: "Benign",
    title: "Ordinary message",
    desc: "A normal message from a friend.",
    text: "Hey! Are we still on for lunch on Saturday? I was thinking that little place near the park at 1pm. Let me know if that works for you, no rush at all.",
  },
];

export default function App() {
  const [view, setView] = useState("home");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeDemo, setActiveDemo] = useState(null);
  const [toast, setToast] = useState(null);
  const resultsRef = useRef(null);

  const showToast = useCallback((text) => {
    setToast({ text });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const runAnalysis = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      showToast("Paste a message first");
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setError({
        code: "too_long",
        message: `Message is too long. Please shorten it to at most ${MAX_LEN} characters.`,
      });
      setView("error");
      return;
    }

    setError(null);
    setView("loading");
    try {
      const [data] = await Promise.all([analyzeMessage(trimmed), delay(MIN_LOADING_MS)]);
      if (data && data.error) {
        setError({ code: data.error, message: data.message || "Analysis failed." });
        setView("error");
        return;
      }
      setResult(data);
      setView("results");
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } catch (e) {
      const code = e && e.code;
      setError({
        code: code || "network",
        message:
          "ScamShield could not complete the analysis. Please try again or check that the backend is available.",
      });
      setView("error");
    }
  }, [message, showToast]);

  const reset = useCallback(() => {
    setView("home");
    setResult(null);
    setError(null);
  }, []);

  const loadDemo = useCallback((demo) => {
    setMessage(demo.text);
    setActiveDemo(demo.id);
    if (view === "results" || view === "error") setView("home");
  }, [view]);

  const copyResults = useCallback(() => {
    if (!result) return;
    const a = result.analysis || {};
    const lines = [];
    lines.push("ScamShield analysis");
    lines.push("====================");
    lines.push(`Risk level: ${a.risk_level || "unknown"}`);
    lines.push(`Risk score: ${a.risk_score ?? 0}/100`);
    lines.push(`Scam type: ${a.scam_type || "Unspecified"}`);
    lines.push("");
    lines.push("Summary:");
    lines.push(a.summary || "");
    lines.push("");
    lines.push("Signals:");
    (a.signals || []).forEach((s, i) => {
      lines.push(
        `${i + 1}. ${s.name} (${s.severity}) — evidence: "${s.evidence}" — ${s.explanation}`
      );
    });
    lines.push("");
    lines.push("Recommended actions:");
    (a.recommended_actions || []).forEach((ac, i) => lines.push(`${i + 1}. ${ac}`));
    lines.push("");
    lines.push("Links detected:");
    (result.links_detected || []).forEach((l) => lines.push(`- ${l}`));
    lines.push("");
    lines.push(a.uncertainty || "");
    lines.push("");
    const isFallback = !(result.analysis?.uncertainty || "").includes("AI-assisted estimate");
    const attribution = isFallback
      ? "Analyzed with ScamShield Pattern Checks (rule-based fallback)"
      : "Analyzed with Qwen3-30B-A3B-Instruct-2507 + ScamShield Pattern Checks";
    lines.push(
      `${attribution}. For demonstration/educational use only — not a guarantee.`
    );
    const text = lines.join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Copied to clipboard"))
      .catch(() => showToast("Copy failed"));
  }, [result, showToast]);

  return (
    <>
      <div className="app-bg" aria-hidden="true" />
      <div className="app-grid" aria-hidden="true" />
      <div className="shell">
        <Header />
        <main className="container">
          {view === "home" && (
            <>
              <HeroSection
                message={message}
                setMessage={(v) => {
                  setMessage(v);
                  if (v !== (activeDemo && DEMOS.find((d) => d.id === activeDemo)?.text))
                    setActiveDemo(null);
                }}
                onAnalyze={runAnalysis}
                maxLen={MAX_LEN}
              />
              <DemoExamples demos={DEMOS} activeId={activeDemo} onSelect={loadDemo} />
              <HowItWorks />
            </>
          )}

          {view === "loading" && <AnalysisLoading />}

          {view === "error" && (
            <div className="panel panel-pad state-card reveal">
              <div className="state-shield">
                <AlertTriangle size={34} />
              </div>
              <div className="big">Analysis couldn’t be completed</div>
              <div className="sub">{error?.message}</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={runAnalysis}>
                  Retry
                </button>
                <button className="btn btn-ghost" onClick={reset}>
                  <ArrowLeft size={16} /> Back to start
                </button>
              </div>
            </div>
          )}

          {view === "results" && result && (
            <div className="results reveal" ref={resultsRef}>
              <div className="results-top">
                <button className="btn btn-ghost results-back" onClick={reset}>
                  <ArrowLeft size={16} /> Analyze another message
                </button>
                <span className="result-badge">ScamShield Pattern Analysis</span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-sm" onClick={copyResults}>
                    <Copy size={15} /> Copy results
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={reset}>
                    <RotateCcw size={15} /> Reset
                  </button>
                </div>
              </div>

              <div className="dash-grid">
                <div className="dash-col">
                  <RiskCard analysis={result.analysis} message={message} />
                  <ScamDNA dna={result.analysis?.scam_dna} />
                  <RecommendedActions actions={result.analysis?.recommended_actions} />
                </div>
                <div className="dash-col">
                  <div className="panel panel-pad">
                    <div className="card-title">
                      <ShieldCheck size={18} className="ico" /> Why ScamShield flagged this
                    </div>
                    {(result.analysis?.signals || []).length === 0 && (
                      <p className="muted">No strong signals were identified.</p>
                    )}
                    {(result.analysis?.signals || []).map((s, i) => (
                      <SignalCard key={i} signal={s} />
                    ))}
                  </div>
                  <HighlightedMessage
                    message={message}
                    signals={result.analysis?.signals || []}
                  />
                  <DeterministicFindings findings={result.deterministic_findings} />
                  <LinksDetected links={result.links_detected} />
                </div>
              </div>

              <div className="disclaimer">
                ScamShield provides an AI-assisted, educational estimate. It cannot guarantee a
                message is legitimate or fraudulent. Always verify important claims through
                official channels. This is not financial, legal, or cybersecurity advice.
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>

      {toast && (
        <div className="toast" role="status">
          <Copy size={15} /> {toast.text}
        </div>
      )}
    </>
  );
}
