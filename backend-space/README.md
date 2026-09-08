# ScamShield — Backend (Hugging Face Space)

A Gradio backend that analyzes suspicious messages with **Qwen3-30B-A3B-Instruct-2507** plus
deterministic rule-based pattern checks, returning a strict, explainable JSON report.

## What it does

- Validates and normalizes the submitted message (max length enforced).
- Runs lightweight deterministic checks (URLs, emails, phones, urgency, impersonation, payment,
  credential, gift-card, crypto, prize, job-offer, delivery, shortened URLs).
- Calls the Qwen model through the Hugging Face server-side Inference API (`HF_TOKEN`).
- Validates, clamps, and falls back safely if the model output is invalid or unavailable.
- Returns a combined result: AI analysis + deterministic findings + extracted links.

The token never leaves the server. The Space only returns the analysis JSON — no prompts, tokens,
or stack traces.

## Files

```
app.py                  Gradio Blocks app + /analyze API
requirements.txt
src/prompts.py          System + user prompt templates
src/model.py            InferenceClient call to Qwen3-30B
src/analyzer.py         Deterministic signal extraction
src/schemas.py          Validation, clamping, combine + fallback
src/utils.py            Whitespace normalization / escaping helpers
```

## Deploy to a Hugging Face Space

1. Create a new Space at https://huggingface.co/new-space (choose the **Gradio** SDK).
2. Upload these files (keep the `src/` folder structure).
3. Add a Space **Secret**:
   - Name: `HF_TOKEN`
   - Value: your Hugging Face token (with inference permissions)
4. Wait for the build to finish. The Space exposes `analyze` as a Gradio API.
5. Test: open the Space UI and paste a message, or call it from the frontend.

## API shape

Input (function argument):

```json
{ "message": "your message text" }
```

Output (the Gradio `/analyze` endpoint returns this JSON object):

```json
{
  "analysis": {
    "risk_level": "low|medium|high",
    "risk_score": 0,
    "scam_type": "string",
    "summary": "string",
    "signals": [
      { "name": "string", "severity": "low|medium|high", "evidence": "quote", "explanation": "string" }
    ],
    "scam_dna": { "urgency": 0, "impersonation": 0, "payment_request": 0, "credential_request": 0, "suspicious_link": 0, "social_engineering": 0 },
    "recommended_actions": ["string"],
    "uncertainty": "string"
  },
  "deterministic_findings": [{ "type": "string", "name": "string", "evidence": "string", "description": "string", "severity": "low|medium|high", "dna": "string" }],
  "links_detected": ["https://example.com"],
  "metadata": { "model": "Qwen/Qwen3-30B-A3B-Instruct-2507", "analysis_type": "AI-assisted risk analysis" }
}
```

## Error handling

- Missing `HF_TOKEN` → the model call is skipped and a deterministic-only fallback is returned
  (the Space still works end-to-end for demos).
- Invalid/partial model JSON → falls back to deterministic analysis.
- Empty / too-long input → controlled error JSON (`{"error": "empty"|"too_long", ...}`).
- No submitted URLs are visited, crawled, or executed.

## Notes on the model

`Qwen/Qwen3-30B-A3B-Instruct-2507` is accessed via the Hugging Face Inference API rather than being
downloaded into the Space. If serverless inference for this model size is unavailable in your
region, the deterministic fallback keeps the product functional.
