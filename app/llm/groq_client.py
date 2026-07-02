from dotenv import load_dotenv
from sympy import content

load_dotenv()

import os
from groq import Groq
from groq.types.chat import ChatCompletionMessageParam
import logging


logger = logging.getLogger(__name__)

# Dynamic Prompt Engineering
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY is not set")

client = Groq(api_key=api_key)

# System Prompt or System Message
def ask_groq(question: str, context: str, style_hint: str = "") -> str:
    # Input Validation
    if not question.strip():
        raise ValueError("Question cannot be empty")

    if context is None:
        raise ValueError("Context cannot be None")
    
    messages: list[ChatCompletionMessageParam] = [
        {
            "role": "system",
            "content": (
                "You are a helpful educational tutor.\n\n"
                "Teaching style (IMPORTANT):\n"
                f"{style_hint}\n\n"

                "Conversation rules:\n"
                "1. If the user greets you (e.g., 'hello', 'hi', 'hey'), respond politely with a short greeting and explain how you can help with the study material.\n"
                "2. If the user asks a general question not related to the provided context, politely ask them to ask a question related to the study material.\n"
                "3. If the user asks a study-related question:\n"
                "- Use the provided context if available.\n"
                "- If no context is provided, answer based on the material selected by the student.\n\n"
                "4. Never refuse to answer simple questions (such as math or basic questions) in the target subject...\n\n"
                "5. Always try to provide examples when the student seems confused.\n\n"
                "6. Never refuse to explain a concept if the student is confused.\n"
                "7. If the user says 'explain again' Or any equivalent sentence, repeat the last explanation in a simpler way.\n"
                "8. If the user says 'give example' Or any equivalent sentence, generate an example based on the last discussed concept.\n"
                "9. Never ask what topic if there is previous conversation.\n"

                "Formatting rules (IMPORTANT):\n"
                "- Output MUST be valid Markdown.\n"
                "- Use headings with ## and ### when helpful.\n"
                "- Use bullet lists (-) and numbered lists (1.).\n"
                "- Use **bold** for key terms.\n"
                "- Separate sections with blank lines.\n\n"

                "When answering study questions, follow this structure:\n"
                "[Optional: A very short encouraging remark if appropriate]\n\n"
                "## Summary\n"
                "- Brief overview from the context.\n\n"
                "## Summary\n"
                "- Brief overview from the context.\n\n"
                "## Explanation\n"
                "1. Step-by-step explanation based only on the context.\n\n"
                "## Key terms\n"
                "- **Term**: definition from the context.\n"
            ),
        },
        {
            "role": "user",
            "content": f"CONTEXT:\n{context}\n\nQUESTION:\n{question}",
        },
    ]

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.4,
            max_completion_tokens=700, #1500 | 2048
            top_p=1,
            stream=False,
        )

    except Exception:
        logger.exception("Groq API request failed")
        raise
        
    content = completion.choices[0].message.content

    if not content:
        logger.error("Groq returned empty content")
        raise RuntimeError("Groq returned empty content")
    
    logger.info("Groq response generated successfully")
    return content


def ask_groq_json(instruction: str, context: str) -> str:
    # Input Validation
    if not instruction.strip():
        raise ValueError("Instruction cannot be empty")

    if context is None:
        raise ValueError("Context cannot be None")
    """
    Groq call that MUST return JSON only (for quiz generation).
    """
    messages: list[ChatCompletionMessageParam] = [
        {
            "role": "system",
            "content": (
                "You are a JSON-only generator. "
                "Return ONLY valid JSON. "
                "No markdown. No backticks. No explanations. No greetings."
            ),
        },
        {
            "role": "user",
            "content": f"CONTEXT:\n{context}\n\nINSTRUCTION:\n{instruction}",
        },
    ]

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.0,
            max_completion_tokens=1500,
            top_p=1,
            stream=False,
        )

    except Exception:
        logger.exception("Groq JSON API request failed")
        raise

    content = completion.choices[0].message.content

    if not content:
        logger.error("Groq returned empty JSON content")
        raise RuntimeError("Groq returned empty content")

    logger.info("Groq JSON generated successfully")

    return content.strip()
