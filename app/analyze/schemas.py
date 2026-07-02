from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from app.common.enums import (
    UnderstandingLevel,
    EngagementLevel,
    LearningStyle,
)
from pydantic import field_validator
from app.common.validators import validate_text

Role = Literal["user", "assistant", "system"]

class ChatMsg(BaseModel):
    role: Role
    content: str = Field(
        ...,
        min_length=1,
    )
    ts: Optional[int] = None
    
    @field_validator("content", mode="before")
    @classmethod
    def validate_content(cls, value):
        return validate_text(value)


class AnalyzeChatRequest(BaseModel):
    student_id: int = Field(..., gt=0)
    conversation_id: str = Field(..., min_length=1)
    messages: List[ChatMsg]

    # optional context
    grade: Optional[int] = Field(default=None, ge=1, le=12)
    subject: Optional[str] = "auto"
    @field_validator(
        "conversation_id",
        "subject",
        mode="before",
    )
    @classmethod
    def validate_strings(cls, value):
        return validate_text(value)


class AnalyzeChatResponse(BaseModel):
    student_id: int
    conversation_id: str

    understanding_level: UnderstandingLevel
    learning_style: LearningStyle
    engagement: EngagementLevel
    
    confusion_points: List[str]
    needs_examples: bool
