import json
from typing import Any, Dict, List
from app.llm.groq_client import ask_groq_json


def build_analyze_instruction(messages: List[dict]) -> str:
    """
    messages: [{role, content}]
    """
    # We're trying to keep the text short: Last N messages user + assistant
    convo_lines = []
    for m in messages:
        role = m.get("role", "user")
        content = (m.get("content") or "").strip()
        if not content:
            continue
        convo_lines.append(f"{role.upper()}: {content}")

    convo_text = "\n".join(convo_lines[-30:])  # Last 30 lines only

    # IMPORTANT: JSON ONLY output
    return f"""
You are an educational chat analyst. 
Return ONLY valid JSON with EXACT keys:
{{
  "stress_level": 0-100,
  "motivation": 0-100,
  "confidence": 0.0-1.0,
  "signals": ["short phrases..."]
}}

Rules:
- Base your scores ONLY on the conversation text.
- Be conservative: do NOT jump to extremes unless very clear.
- stress_level: higher means more stress/anxiety/confusion/pressure.
- motivation: higher means more engagement/effort/positive intent.
- confidence: how sure you are about your estimates based on evidence.

Conversation:
{convo_text}
""".strip()


def parse_analysis_json(raw: str) -> Dict[str, Any]:
    """
    Groq might return valid JSON but sometimes with spaces/newlines.
    """
    raw = raw.strip()

    # If it accidentally returns extra text, try to extract first JSON object
    if not raw.startswith("{"):
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            raw = raw[start : end + 1]

    data = json.loads(raw)

    # normalize + clamp
    stress = int(max(0, min(100, int(data.get("stress_level", 50)))))
    mot = int(max(0, min(100, int(data.get("motivation", 50)))))
    conf = float(data.get("confidence", 0.5))
    conf = max(0.0, min(1.0, conf))
    signals = data.get("signals") or []
    if not isinstance(signals, list):
        signals = []

    return {
        "stress_level": stress,
        "motivation": mot,
        "confidence": conf,
        "signals": [str(x) for x in signals][:10],
    }


def analyze_chat(messages: List[dict], context: str = "") -> Dict[str, Any]:
    instruction = build_analyze_instruction(messages)
    raw = ask_groq_json(instruction=instruction, context=context)
    return parse_analysis_json(raw)
