import os
import re
import json
import sys
import traceback
from huggingface_hub import InferenceClient

from lib.prompts import MODEL_ID

DEFAULT_TIMEOUT = 8


def _log_hf_error(exc, token=None):
    exc_type = type(exc).__name__
    status_code = None
    error_msg = str(exc)
    response_text = ""

    response = getattr(exc, "response", None)
    if response is not None:
        status_code = getattr(response, "status_code", None)
        try:
            response_text = response.text or ""
        except Exception:
            response_text = ""

    request = None
    try:
        request = exc.request
    except (RuntimeError, AttributeError):
        request = None
    if request is not None:
        headers = getattr(request, "headers", {})
        for key in list(headers.keys()):
            if key.lower() == "authorization" and token:
                headers[key] = "[REDACTED]"
            elif "token" in key.lower() and token:
                headers[key] = "[REDACTED]"

    if token:
        error_msg = error_msg.replace(token, "[REDACTED]")
        response_text = response_text.replace(token, "[REDACTED]")

    print(
        f"[HF_ERROR] type={exc_type} status={status_code} message={error_msg}",
        file=sys.stderr,
    )
    if response_text:
        print(f"[HF_ERROR] response_body={response_text}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)


def _strip_think(text: str) -> str:
    if not text:
        return ""
    # Remove Qwen reasoning blocks if present.
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    return text.strip()


def _call_model(client, messages):
    """Call the chat-completion endpoint in a version-tolerant way.

    huggingface_hub >=0.25 exposes an OpenAI-compatible `client.chat.completions.create`,
    while some versions expose the singular `client.chat_completion`. Both return the same
    ChatCompletionOutput shape.
    """
    try:
        return client.chat.completions.create(
            model=MODEL_ID,
            messages=messages,
            max_tokens=1600,
            temperature=0.2,
        )
    except AttributeError:
        return client.chat_completion(
            model=MODEL_ID,
            messages=messages,
            max_tokens=1600,
            temperature=0.2,
        )


def _extract_content(completion):
    try:
        return completion.choices[0].message.content
    except (AttributeError, IndexError, TypeError):
        if isinstance(completion, str):
            return completion
        return None


def _run_inference(system_prompt: str, user_prompt: str, token: str):
    client = InferenceClient(token=token, timeout=DEFAULT_TIMEOUT, provider="featherless-ai")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    completion = _call_model(client, messages)
    content = _extract_content(completion)
    return _strip_think(content or "")


def run_model(user_prompt: str, system_prompt: str):
    """Call the Qwen model through the Hugging Face Inference API.

    Returns a tuple (raw_text, error_code).
    error_code is None on success, otherwise one of:
      "missing_token", "model_error", "timeout".
    """
    token_present = bool(os.environ.get("HF_TOKEN"))
    print(f"HF_TOKEN_PRESENT={str(token_present).lower()}", file=sys.stderr)
    token = os.environ.get("HF_TOKEN")
    if not token:
        return None, "missing_token"
    print("[HF_DIAG] calling InferenceClient", file=sys.stderr)
    try:
        result = _run_inference(system_prompt, user_prompt, token), None
        print("[HF_DIAG] InferenceClient call completed", file=sys.stderr)
        return result
    except Exception as exc:
        print("[HF_DIAG] InferenceClient call raised exception", file=sys.stderr)
        _log_hf_error(exc, token=token)
        return None, "model_error"
