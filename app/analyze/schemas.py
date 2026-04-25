from pydantic import BaseModel, Field
from typing import List, Optional, Literal


Role = Literal["user", "assistant", "system"]


class ChatMsg(BaseModel):
    role: Role
    content: str
    ts: Optional[int] = None


class AnalyzeChatRequest(BaseModel):
    student_id: int
    conversation_id: str
    messages: List[ChatMsg]

    # optional context
    grade: Optional[int] = None
    subject: Optional[str] = "auto"


class AnalyzeChatResponse(BaseModel):
    student_id: int
    conversation_id: str
    stress_level: int = Field(ge=0, le=100)
    motivation: int = Field(ge=0, le=100)
    confidence: float = Field(ge=0.0, le=1.0)

    # optional helpful debug
    signals: List[str] = []
