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
    You are an educational chat analyzer.

    Return ONLY valid JSON:

    {{
    "understanding_level": "low | medium | high",
    "learning_style": "step_by_step | direct | visual",
    "engagement": "low | medium | high",
    "confusion_points": ["topics..."],
    "needs_examples": true/false
    }}

    Rules:
    - Base on student messages
    - If student asks many questions → low understanding
    - If student says "I don't understand" → confusion
    - If student is short → low engagement
    - If student asks for examples → needs_examples = true

    Conversation:
    {convo_text}
    """.strip()


def parse_analysis_json(raw: str) -> Dict[str, Any]:
    raw = raw.strip()

    if not raw.startswith("{"):
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1:
            raw = raw[start : end + 1]

    data = json.loads(raw)

    return {
        "understanding_level": data.get("understanding_level", "medium"),
        "learning_style": data.get("learning_style", "step_by_step"),
        "engagement": data.get("engagement", "medium"),
        "confusion_points": data.get("confusion_points", [])[:5],
        "needs_examples": bool(data.get("needs_examples", True)),
    }


def analyze_chat(messages: List[dict], context: str = "") -> Dict[str, Any]:
    instruction = build_analyze_instruction(messages)
    raw = ask_groq_json(instruction=instruction, context=context)
    return parse_analysis_json(raw)
