"""Small shared helpers used across the backend modules."""
import re


def normalize_whitespace(text: str) -> str:
    """Collapse excessive whitespace without removing meaningful punctuation or URLs."""
    if not text:
        return ""
    # Normalize line endings and tabs.
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\t", " ")
    # Collapse 3+ newlines into 2.
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse runs of spaces.
    text = re.sub(r"[ ]{2,}", " ", text)
    return text.strip()


def escape_html(text: str) -> str:
    """Escape text for safe display. The backend treats all content as untrusted."""
    if text is None:
        return ""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )
