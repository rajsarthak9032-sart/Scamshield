import re
import json

from src.prompts import MODEL_ID

RISK_LEVELS = {"low", "medium", "high"}
SEVERITY_LEVELS = {"low", "medium", "high"}
DNA_KEYS = [
    "urgency",
    "impersonation",
    "payment_request",
    "credential_request",
    "suspicious_link",
    "social_engineering",
]

DEFAULT_UNCERTAINTY = (
    "This is an AI-assisted estimate based on patterns in the message, not a guarantee. "
    "Always verify important claims independently."
)


def _strip_think(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def _safe_json_load(text: str):
    text = _strip_think(text)
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Attempt to extract the first balanced JSON object.
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


def _int_range(value, lo, hi, default):
    try:
        x = int(float(value))
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, x))


def _as_str(value, default=""):
    if value is None:
        return default
    return str(value)


def validate_analysis(raw_text):
    """Validate and normalize raw model output into a strict analysis dict.

    Returns (analysis_dict, error_code). error_code is None on success.
    """
    data = _safe_json_load(raw_text)
    if data is None:
        return None, "invalid_json"
    if not isinstance(data, dict):
        return None, "invalid_json"

    risk_level = _as_str(data.get("risk_level"), "unknown").lower()
    if risk_level not in RISK_LEVELS:
        # Infer from score if possible.
        score = _int_range(data.get("risk_score"), 0, 100, 0)
        risk_level = "high" if score >= 67 else ("medium" if score >= 34 else "low")

    signals = []
    raw_signals = data.get("signals") or []
    if isinstance(raw_signals, list):
        for s in raw_signals:
            if not isinstance(s, dict):
                continue
            severity = _as_str(s.get("severity"), "low").lower()
            if severity not in SEVERITY_LEVELS:
                severity = "low"
            evidence = _as_str(s.get("evidence"), "").strip()
            signals.append(
                {
                    "name": _as_str(s.get("name"), "Suspicious signal").strip(),
                    "severity": severity,
                    "evidence": evidence,
                    "explanation": _as_str(s.get("explanation"), "").strip(),
                }
            )

    dna = {}
    raw_dna = data.get("scam_dna") or {}
    if not isinstance(raw_dna, dict):
        raw_dna = {}
    for key in DNA_KEYS:
        dna[key] = _int_range(raw_dna.get(key), 0, 100, 0)

    actions = []
    raw_actions = data.get("recommended_actions") or []
    if isinstance(raw_actions, list):
        for a in raw_actions:
            if a is None:
                continue
            text = _as_str(a, "").strip()
            if text:
                actions.append(text)

    analysis = {
        "risk_level": risk_level,
        "risk_score": _int_range(data.get("risk_score"), 0, 100, 0),
        "scam_type": _as_str(data.get("scam_type"), "Unspecified").strip(),
        "summary": _as_str(data.get("summary"), "").strip(),
        "signals": signals,
        "scam_dna": dna,
        "recommended_actions": actions,
        "uncertainty": _as_str(data.get("uncertainty"), DEFAULT_UNCERTAINTY).strip(),
    }
    return analysis, None


def combine_result(analysis, deterministic, message):
    return {
        "analysis": analysis,
        "deterministic_findings": deterministic.get("findings", []),
        "links_detected": deterministic.get("links", []),
        "metadata": {
            "model": MODEL_ID,
            "analysis_type": "AI-assisted risk analysis",
        },
    }


def error_result(code, max_len=None):
    msg = {
        "empty": "Please paste a message to analyze.",
        "too_long": f"Message is too long. Please shorten it to at most {max_len} characters.",
        "invalid": "Analysis could not be completed. Please try again.",
    }.get(code, "Analysis could not be completed.")
    return {
        "error": code,
        "message": msg,
        "metadata": {"model": MODEL_ID, "analysis_type": "error"},
    }


def fallback_result(deterministic, message):
    """Build an explainable result using only deterministic findings.

    Used when the model is unavailable so the product still works end-to-end.
    """
    findings = deterministic.get("findings", [])
    dna = {key: 10 for key in DNA_KEYS}
    dna_present = {key: 0 for key in DNA_KEYS}

    severity_value = {"low": 45, "medium": 68, "high": 90}

    for f in findings:
        dna_key = f.get("dna")
        if dna_key in dna_present:
            val = severity_value.get(f.get("severity", "low"), 45)
            dna_present[dna_key] = max(dna_present[dna_key], val)

    for key, val in dna_present.items():
        if val:
            dna[key] = val

    # Risk score from weighted findings.
    weights = {
        "credential_request": 22,
        "payment_request": 20,
        "impersonation": 16,
        "urgency_language": 14,
        "suspicious_link": 12,
        "gift_card": 18,
        "crypto_request": 18,
        "threat_closure": 16,
        "prize_language": 12,
        "job_offer": 10,
        "delivery_language": 8,
        "phone_number": 4,
        "email_address": 3,
        "personal_info": 16,
        "social_engineering": 14,
        "shortened_url": 12,
    }
    score = 0
    for f in findings:
        score += weights.get(f.get("type"), 4)
    score = min(100, score)

    if not findings:
        # Benign-leaning default.
        risk_level = "low"
        score = 12
        summary = (
            "No strong manipulation patterns were detected by the rule-based checks. "
            "This does not guarantee the message is safe."
        )
        uncertainty = (
            "The AI model was unavailable for this request, so this result is based only on "
            "lightweight pattern checks. It is not a guarantee of safety or fraud."
        )
    else:
        risk_level = "high" if score >= 67 else ("medium" if score >= 34 else "low")
        summary = (
            "Rule-based checks detected several manipulation patterns in this message. "
            "The AI model was unavailable for deeper analysis."
        )
        uncertainty = (
            "The AI model was unavailable, so this result relies only on pattern checks. "
            "Treat it as a preliminary signal, not a final verdict."
        )

    signals = []
    for f in findings:
        if f.get("evidence"):
            signals.append(
                {
                    "name": f.get("name", "Pattern detected"),
                    "severity": f.get("severity", "low"),
                    "evidence": f.get("evidence"),
                    "explanation": f.get("description", ""),
                }
            )

    actions = [
        "Do not click unexpected links or call numbers in the message.",
        "Do not provide passwords, verification codes, or payment details.",
        "Verify the claim through the organization's official app or website.",
        "Report the message using the platform's built-in reporting tools.",
    ]

    analysis = {
        "risk_level": risk_level,
        "risk_score": score,
        "scam_type": _infer_type(findings),
        "summary": summary,
        "signals": signals,
        "scam_dna": dna,
        "recommended_actions": actions,
        "uncertainty": uncertainty,
    }
    return combine_result(analysis, deterministic, message)


def _infer_type(findings):
    types = {f.get("type") for f in findings}
    if "delivery_language" in types:
        return "Delivery / package impersonation"
    if "job_offer" in types:
        return "Fake job offer"
    if "prize_language" in types:
        return "Prize / lottery scam"
    if "credential_request" in types or "impersonation" in types:
        return "Phishing / impersonation"
    if "payment_request" in types or "gift_card" in types or "crypto_request" in types:
        return "Payment fraud"
    if "urgency_language" in types or "threat_closure" in types:
        return "Urgency / pressure scam"
    return "Suspicious pattern detected"
