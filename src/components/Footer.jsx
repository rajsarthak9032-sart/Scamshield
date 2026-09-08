import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span className="brand-mark" style={{ width: 28, height: 28, borderRadius: 8 }}>
            <ShieldCheck size={15} />
          </span>
          <span>ScamShield — explainable scam intelligence</span>
        </div>
        <div className="footer-links">
          <a
            href="https://huggingface.co/Qwen/Qwen3-30B-A3B-Instruct-2507"
            target="_blank"
            rel="noreferrer"
          >
            Model credits
          </a>
          <a href="https://huggingface.co/new-space/agents.md" target="_blank" rel="noreferrer">
            HF Static Space
          </a>
          <a href="#top">Back to top</a>
        </div>
      </div>
    </footer>
  );
}
