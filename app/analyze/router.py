from fastapi import APIRouter, HTTPException
from app.analyze.schemas import AnalyzeChatRequest, AnalyzeChatResponse
from app.analyze.service import analyze_chat
from app.analyze.store import save_profile
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze-chat", response_model=AnalyzeChatResponse)
def analyze_chat_endpoint(req: AnalyzeChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages is empty")

    # analyze
    try:
        result = analyze_chat(messages=[m.model_dump() for m in req.messages])

    except Exception:
        logger.exception("Failed to analyze chat")

        result = {
            "understanding_level": "medium",
            "learning_style": "step_by_step",
            "engagement": "medium",
            "confusion_points": [],
            "needs_examples": True,
        }

    profile = {
        "student_id": req.student_id,
        "conversation_id": req.conversation_id,
        **result,
    }

    # store (temporary)
    save_profile(req.student_id, profile)

    return AnalyzeChatResponse(
        student_id=req.student_id,
        conversation_id=req.conversation_id,
        **result,
    )