import os
import re
import json
from huggingface_hub import InferenceClient

from src.prompts import MODEL_ID

DEFAULT_TIMEOUT = 90


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
    client = InferenceClient(token=token, timeout=DEFAULT_TIMEOUT)
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
    token = os.environ.get("HF_TOKEN")
    if not token:
        return None, "missing_token"
    try:
        return _run_inference(system_prompt, user_prompt, token), None
    except Exception:
        return None, "model_error"
