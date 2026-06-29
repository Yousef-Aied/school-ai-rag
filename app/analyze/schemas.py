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

    understanding_level: str
    learning_style: str
    engagement: str
    confusion_points: List[str]
    needs_examples: bool
