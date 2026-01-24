from dotenv import load_dotenv
from groq.types.chat import ChatCompletionMessageParam

load_dotenv()

import os
from groq import Groq
from groq.types.chat import ChatCompletionMessageParam

# Dynamic Prompt Engineering
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY is not set")

client = Groq(api_key=api_key)

# System Prompt or System Message
def ask_groq(question: str, context: str) -> str:
    messages: list[ChatCompletionMessageParam] = [
        {
            "role": "system",
            "content": (
                "You are a helpful educational tutor.\n\n"

                "Conversation rules:\n"
                "1. If the user greets you (e.g., 'hello', 'hi', 'hey'), respond politely with a short greeting and explain how you can help with the study material.\n"
                "2. If the user asks a general question not related to the provided context, politely ask them to ask a question related to the study material.\n"
                "3. If the user asks a study-related question, answer ONLY using the provided context.\n"
                "4. If a study-related question cannot be answered from the context, say exactly:\n"
                "   I don't know from the provided material.\n\n"

                "Formatting rules (IMPORTANT):\n"
                "- Output MUST be valid Markdown.\n"
                "- Use headings with ## and ### when helpful.\n"
                "- Use bullet lists (-) and numbered lists (1.).\n"
                "- Use **bold** for key terms.\n"
                "- Separate sections with blank lines.\n\n"

                "When answering study questions, follow this structure:\n"
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

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.2,
        max_completion_tokens=700,
        top_p=1,
        stream=False,
    )
    
    content = completion.choices[0].message.content
    if content is None:
        raise RuntimeError("Groq returned empty content")

    return content


def ask_groq_json(instruction: str, context: str) -> str:
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

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.0,
        max_completion_tokens=1500,
        top_p=1,
        stream=False,
    )

    content = completion.choices[0].message.content
    if content is None:
        raise RuntimeError("Groq returned empty content")
    return content.strip()
