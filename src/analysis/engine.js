const URL_RE = /https?:\/\/[^\s'")\]<>]+/gi;
const BARE_URL_RE = /\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|uk|us|info|xyz|ru|cn|link|click|top|shop|app|live|online|vip)\b\/?[^\s'")\]<>]*/gi;
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /\+?\d[\d\s().\-]{7,}\d/g;

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "cutt.ly",
  "rb.gy", "is.gd", "buff.ly", "shorturl.at", "rebrand.ly", "tiny.cc",
  "clk.sh", "su.do",
]);

const BRANDS = [
  "paypal", "apple", "google", "microsoft", "amazon", "netflix",
  "bank of america", "wells fargo", "chase", "citibank", "hsbc", "barclays",
  "irs", "hmrc", "fedex", "ups", "dhl", "usps", "royal mail", "customs",
  "coinbase", "binance", "whatsapp", "instagram", "facebook", "linkedin",
  "tiktok", "santander", "natwest", "ocbc", "maybank",
];

// [type, name, regex, severity, dnaKey, description]
const PATTERN_RULES = [
  ["urgency_language", "Urgency language",
   /\b(act now|urgent|immediately|asap|right away|now|today only|last chance|final notice|deadline|hurry|before it's too late|within 24 hours|expires? (today|soon)|limited time|don'?t (wait|delay))\b/i,
   "high", "urgency",
   "The message pressures you to act quickly, which reduces time to verify."],
  ["threat_closure", "Account closure threat",
   /\b(account (will be|is being)? ?(closed|suspended|locked|blocked|deactivated|disabled|terminated)|suspend(ed)?|deactivat(ed)?|your (card|account) (has been )?blocked)\b/i,
   "high", "impersonation",
   "The message threatens to close or lock your account to create fear."],
  ["credential_request", "Credential request",
   /\b(enter your (password|login)|verify your (password|identity|account)|log ?in to (confirm|verify)|confirm your (password|details)|sign ?in (now|here)|update your (password|account|details))\b/i,
   "high", "credential_request",
   "The message asks for your password or login details, which legitimate companies rarely do."],
  ["verification_code", "Verification code request",
   /\b(verification code|one[- ]?time (code|password)|otp|2fa|two[- ]factor)\b/i,
   "medium", "credential_request",
   "The message references a code, attempting to get it from you or trick you into sharing it."],
  ["payment_request", "Payment request",
   /\b(send (money|payment|the fee)|wire (money|transfer)|make a (payment|transfer)|pay (the|your) (fee|invoice|fine|balance)|transfer (funds|money)|settlement|outstanding (balance|invoice))\b/i,
   "high", "payment_request",
   "The message directly requests a payment or money transfer."],
  ["gift_card", "Gift-card request",
   /\b(gift ?card|amazon card|itunes card|google play card|steam card|ebay card|redeem (a )?card|card (number|pin))\b/i,
   "high", "payment_request",
   "Gift cards are a common scam payment method because they are hard to reverse."],
  ["crypto_request", "Cryptocurrency request",
   /\b(bitcoin|btc|ethereum|eth|usdt|tether|crypto(?:currency)?|wallet address|blockchain)\b/i,
   "high", "payment_request",
   "The message references cryptocurrency, a frequent scam payment channel."],
  ["personal_info", "Personal information request",
   /\b(social security|ssn|date of birth|passport|driver'?s licen[sc]e|bank account number|sort code|routing number|national insurance)\b/i,
   "high", "credential_request",
   "The message asks for sensitive identity or financial details."],
  ["prize_language", "Prize / lottery language",
   /\b(you (have )?won|congratulations|winner|lottery|prize|sweepstakes|claim your (reward|prize)|selected (to receive|as the)|reward (is|of))\b/i,
   "medium", "social_engineering",
   "Unexpected prize or lottery wins are a classic manipulation tactic."],
  ["job_offer", "Fake job-offer language",
   /\b(job offer|employment offer|work from home|part[- ]time (job|role)|earn (up to|money)|hiring (now|immediately)|remote position|training fee|onboarding (fee|payment)|recruit(ing|ment)?)\b/i,
   "medium", "social_engineering",
   "Unsolicited job offers that ask for fees or personal data are often scams."],
  ["delivery_language", "Delivery / package language",
   /\b(package|parcel|shipment|delivery|couriers?|shipping|tracking (number|id)?|post office|customs (fee|charge)|missed delivery)\b/i,
   "medium", "impersonation",
   "Delivery-themed messages impersonate carriers to create believable panic."],
  ["impersonation", "Brand / authority impersonation",
   new RegExp("\\b(" + BRANDS.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b", "i"),
   "high", "impersonation",
   "The message name-drops a known brand or authority to appear legitimate."],
  ["social_engineering", "Social-engineering language",
   /\b(trust me|help me|friends? (and family|only)|keep (this )?confidential|don'?t tell|act fast|for your safety|secure your account)\b/i,
   "medium", "social_engineering",
   "The message tries to build false trust or pressure secrecy."],
];

const DNA_KEYS = ["urgency", "impersonation", "payment_request", "credential_request", "suspicious_link", "social_engineering"];

function extractLinks(text) {
  const links = [];
  let m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) links.push(m[0].replace(/[.,;]+$/, ""));
  BARE_URL_RE.lastIndex = 0;
  while ((m = BARE_URL_RE.exec(text)) !== null) {
    const c = m[0].replace(/[.,;]+$/, "");
    if (!links.includes(c)) links.push(c);
  }
  const ordered = [...new Set(links)].sort((a, b) => b.length - a.length);
  return ordered.filter((l) => !ordered.some((k) => k !== l && k.includes(l)));
}

function checkShortened(links) {
  return links.filter((l) => {
    const host = l.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    return SHORTENERS.has(host);
  });
}

function deterministicAnalysis(text) {
  const findings = [];
  const links = extractLinks(text);
  const shortened = checkShortened(links);

  const emails = text.match(EMAIL_RE) || [];
  const phones = (text.match(PHONE_RE) || [])
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, "").length >= 8);

  for (const [type, name, rgx, severity, dnaKey, description] of PATTERN_RULES) {
    rgx.lastIndex = 0;
    const match = rgx.exec(text);
    if (match) {
      findings.push({ type, name, evidence: match[0].trim(), description, severity, dna: dnaKey });
    }
  }

  if (emails.length) {
    findings.push({
      type: "email_address", name: "Email address found", evidence: emails[0],
      description: "An email address appears in the message and may be used to contact or impersonate you.",
      severity: "low", dna: "social_engineering",
    });
  }
  if (phones.length) {
    findings.push({
      type: "phone_number", name: "Phone number found", evidence: phones[0],
      description: "A phone number appears in the message. Verify it through official channels before calling.",
      severity: "low", dna: "social_engineering",
    });
  }
  if (links.length) {
    findings.push({
      type: "suspicious_link", name: "Link detected", evidence: links[0],
      description: "The message contains a link. Do not open unexpected links; verify the sender first.",
      severity: links.length === 1 ? "medium" : "high", dna: "suspicious_link",
    });
  }
  if (shortened.length) {
    findings.push({
      type: "shortened_url", name: "Shortened URL detected", evidence: shortened[0],
      description: "Shortened URLs hide the real destination and are common in scams.",
      severity: "medium", dna: "suspicious_link",
    });
  }

  return { links, emails, phones, shortened, findings };
}

const WEIGHTS = {
  credential_request: 22, payment_request: 20, impersonation: 16, urgency_language: 14,
  suspicious_link: 12, gift_card: 18, crypto_request: 18, threat_closure: 16,
  prize_language: 12, job_offer: 10, delivery_language: 8, phone_number: 4,
  email_address: 3, personal_info: 16, social_engineering: 14, shortened_url: 12,
};

function inferType(findings) {
  const types = new Set(findings.map((f) => f.type));
  if (types.has("delivery_language")) return "Delivery / package impersonation";
  if (types.has("job_offer")) return "Fake job offer";
  if (types.has("prize_language")) return "Prize / lottery scam";
  if (types.has("credential_request") || types.has("impersonation")) return "Phishing / impersonation";
  if (types.has("payment_request") || types.has("gift_card") || types.has("crypto_request")) return "Payment fraud";
  if (types.has("urgency_language") || types.has("threat_closure")) return "Urgency / pressure scam";
  return "Suspicious pattern detected";
}

function buildResult(text) {
  const det = deterministicAnalysis(text);
  const findings = det.findings;

  const dna = {};
  const dnaPresent = {};
  DNA_KEYS.forEach((k) => { dna[k] = 10; dnaPresent[k] = 0; });
  const sevVal = { low: 45, medium: 68, high: 90 };
  for (const f of findings) {
    const key = f.dna;
    if (key in dnaPresent) dnaPresent[key] = Math.max(dnaPresent[key], sevVal[f.severity] || 45);
  }
  for (const [k, v] of Object.entries(dnaPresent)) dna[k] = v || 10;

  let score = 0;
  for (const f of findings) score += WEIGHTS[f.type] || 4;
  score = Math.min(100, score);

  let riskLevel, summary, uncertainty;
  if (findings.length === 0) {
    riskLevel = "low"; score = Math.min(score, 12);
    summary = "No strong manipulation patterns were detected by the pattern checks. This does not guarantee the message is safe.";
    uncertainty = "This result comes from ScamShield's rule-based pattern analysis, not an AI model. It is an educational estimate, not a guarantee. Always verify important claims independently.";
  } else {
    riskLevel = score >= 67 ? "high" : score >= 34 ? "medium" : "low";
    summary = "ScamShield's pattern checks detected manipulation patterns in this message. Review the evidence below before taking any action.";
    uncertainty = "This result comes from ScamShield's rule-based pattern analysis, not an AI model. It is an educational estimate, not a guarantee. Always verify important claims independently.";
  }

  const signals = findings
    .filter((f) => f.evidence)
    .map((f) => ({ name: f.name, severity: f.severity, evidence: f.evidence, explanation: f.description }));

  const recommendedActions = [
    "Do not click unexpected links or call numbers in the message.",
    "Do not provide passwords, verification codes, or payment details.",
    "Verify the claim through the organization's official app or website.",
    "Report the message using the platform's built-in reporting tools.",
  ];

  const analysis = {
    risk_level: riskLevel,
    risk_score: score,
    scam_type: inferType(findings),
    summary,
    signals,
    scam_dna: dna,
    recommended_actions: recommendedActions,
    uncertainty,
  };

  return {
    analysis,
    deterministic_findings: findings,
    links_detected: det.links,
    metadata: { model: "ScamShield Pattern Engine", analysis_type: "Rule-based pattern analysis" },
  };
}

export function analyzeText(text) {
  const trimmed = (text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, " ").replace(/\n{3,}/g, "\n\n").replace(/ {2,}/g, " ").trim();
  if (!trimmed) {
    return { error: "empty", message: "Please paste a message to analyze.", metadata: { model: "ScamShield Pattern Engine", analysis_type: "error" } };
  }
  if (trimmed.length > 8000) {
    return { error: "too_long", message: "Message is too long. Please shorten it to at most 8000 characters.", metadata: { model: "ScamShield Pattern Engine", analysis_type: "error" } };
  }
  return buildResult(trimmed);
}
