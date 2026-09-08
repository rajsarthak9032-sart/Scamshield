import { ShieldAlert, Eraser } from "lucide-react";

export default function MessageInput({ message, setMessage, onAnalyze, maxLen }) {
  const len = message.length;
  const over = len > maxLen;
  const tooLongMsg = over
    ? `Message is ${len - maxLen} characters over the limit. Please shorten it.`
    : "";

  return (
    <div className="analyzer panel panel-pad">
      <textarea
        className="msg-input"
        placeholder="Paste a suspicious email, SMS, DM, job offer, delivery message, or other message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        aria-label="Message to analyze"
        maxLength={maxLen + 200}
      />
      <div className="analyzer-row">
        <span className={`char-count ${over ? "warn" : ""}`}>
          {len} / {maxLen}
          {over ? ` — ${tooLongMsg}` : ""}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessage("")}>
            <Eraser size={15} /> Clear
          </button>
          <button
            className="btn btn-primary"
            onClick={onAnalyze}
            disabled={over || len === 0}
          >
            <ShieldAlert size={16} /> Analyze Message
          </button>
        </div>
      </div>
      <div className="privacy-inline">
        <ShieldAlert size={14} />
        Do not paste passwords, authentication codes, or sensitive personal information.
      </div>
    </div>
  );
}
