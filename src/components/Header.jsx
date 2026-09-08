import { ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={20} />
          </span>
          ScamShield
        </div>
        <nav className="nav-links">
          <a href="#how">How it works</a>
          <a href="#demo">Try a demo</a>
          <a
            href="https://huggingface.co/Qwen/Qwen3-30B-A3B-Instruct-2507"
            target="_blank"
            rel="noreferrer"
          >
            Model credits
          </a>
        </nav>
      </div>
    </header>
  );
}
