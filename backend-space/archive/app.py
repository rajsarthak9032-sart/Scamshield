from src.prompts import SYSTEM_PROMPT, build_user_prompt, MAX_MESSAGE_LENGTH
from src.model import run_model
from src.analyzer import deterministic_analysis
from src.schemas import (
    validate_analysis,
    combine_result,
    fallback_result,
    error_result,
)
from src.utils import normalize_whitespace

import gradio as gr
import os


def analyze(message: str):
    """Core analysis function exposed through the Gradio API (`api_name="analyze"`)."""
    if message is None:
        return error_result("empty")
    message = normalize_whitespace(str(message))
    if not message:
        return error_result("empty")
    if len(message) > MAX_MESSAGE_LENGTH:
        return error_result("too_long", max_len=MAX_MESSAGE_LENGTH)

    deterministic = deterministic_analysis(message)

    user_prompt = build_user_prompt(message)
    raw, err = run_model(user_prompt=user_prompt, system_prompt=SYSTEM_PROMPT)

    if raw is not None and not err:
        analysis, verr = validate_analysis(raw)
        if analysis is not None:
            return combine_result(analysis, deterministic, message)

    # Model unavailable or invalid output: still return a controlled, explainable result.
    return fallback_result(deterministic, message)


EXAMPLES = [
    ["Your account has been temporarily locked. Verify your identity now: https://chase-secure-verify.com or it will be suspended."],
    ["Congratulations! You won a prize. Pay a small fee with a gift card to claim it."],
    ["Hey! Are we still on for lunch on Saturday? No rush at all."],
]

demo = gr.Interface(
    fn=analyze,
    inputs=gr.Textbox(
        label="message",
        placeholder="Paste a suspicious email, SMS, DM, job offer, or other message here...",
        lines=10,
        max_lines=30,
    ),
    outputs=gr.JSON(label="ScamShield analysis"),
    title="ScamShield API",
    description=(
        "Explainable scam-analysis API powered by Qwen3-30B-A3B-Instruct-2507. "
        "Call this Space programmatically via the `analyze` endpoint."
    ),
    api_name="analyze",
    examples=EXAMPLES,
)

demo.launch(
    server_name="0.0.0.0",
    server_port=int(os.environ.get("PORT", 7860)),
    css="""
    .gradio-container { background:#060a14; color:#e8eefc; }
    """,
)
