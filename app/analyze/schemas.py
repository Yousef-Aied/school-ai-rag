from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from app.common.enums import (
    UnderstandingLevel,
    EngagementLevel,
    LearningStyle,
)

Role = Literal["user", "assistant", "system"]

class ChatMsg(BaseModel):
    role: Role
    content: str = Field(
        ...,
        min_length=1,
    )
    ts: Optional[int] = None


class AnalyzeChatRequest(BaseModel):
    student_id: int = Field(..., gt=0)
    conversation_id: str = Field(..., min_length=1)
    messages: List[ChatMsg]

    # optional context
    grade: Optional[int] = Field(default=None, ge=1, le=12)
    subject: Optional[str] = "auto"


class AnalyzeChatResponse(BaseModel):
    student_id: int
    conversation_id: str

    understanding_level: UnderstandingLevel
    learning_style: LearningStyle
    engagement: EngagementLevel
    
    confusion_points: List[str]
    needs_examples: bool
