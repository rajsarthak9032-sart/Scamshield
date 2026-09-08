import os
import json
import sys
from http.server import BaseHTTPRequestHandler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from lib.prompts import SYSTEM_PROMPT, build_user_prompt, MAX_MESSAGE_LENGTH
from lib.model import run_model
from lib.analyzer import deterministic_analysis
from lib.schemas import validate_analysis, combine_result, fallback_result, error_result
from lib.utils import normalize_whitespace


def analyze(message):
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
    return fallback_result(deterministic, message)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
        except Exception:
            data = {}

        message = data.get("data", [None])
        if isinstance(message, list) and message:
            message = message[0]
        if message is None:
            message = data.get("message", "")

        result = analyze(message)
        status = 400 if isinstance(result, dict) and result.get("error") else 200

        response_body = json.dumps(result).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(response_body)))
        self.end_headers()
        self.wfile.write(response_body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
