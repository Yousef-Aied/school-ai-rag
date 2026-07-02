from pydantic import BaseModel, Field
from typing import List, Optional
from pydantic import field_validator
from app.common.validators import validate_text

# This is just the “data forms” going/coming back from the API (so that there is a clear Contract for the team).
class GenerateQuizRequest(BaseModel):
    student_id: int = Field(..., gt=0)

    grade: int = Field(..., ge=1, le=12)

    conversation_id: Optional[str] = Field(
        default=None,
        min_length=1
    )

    n_questions: int = Field(
        default=10,
        ge=1,
        le=20
    )

    topic: str = Field(
        ...,
        min_length=2
    )
    @field_validator(
        "conversation_id",
        "topic",
        mode="before",
    )
    @classmethod
    def validate_strings(cls, value):
        return validate_text(value)

class QuizQuestionPublic(BaseModel):
    question_id: str
    question_text: str
    choices: List[str]

class GenerateQuizResponse(BaseModel):
    quiz_id: str
    student_id: int
    conversation_id: Optional[str] = None
    questions: List[QuizQuestionPublic]

class SubmitAnswer(BaseModel):
    question_id: str
    selected_index: int = Field(..., ge=0, le=3)

class SubmitQuizRequest(BaseModel):
    quiz_id: str = Field(..., min_length=1)
    student_id: int = Field(..., gt=0)
    started_at: Optional[str] = None  # ISO string
    submitted_at: Optional[str] = None
    answers: List[SubmitAnswer]

class ReviewItem(BaseModel):
    question_id: str
    is_correct: bool
    correct_index: int

class SubmitQuizResponse(BaseModel):
    quiz_id: str
    student_id: int
    score: int
    max_score: int
    completion_rate: float
    review: List[ReviewItem]



# ===============================
# createTeacherQuizAssignment APIunits
class QuizTemplateGenerateRequest(BaseModel):
    grade_level: int = Field(..., ge=1, le=12)
    subject: str = Field(..., min_length=2)
    number_of_questions: int = Field(default=10, ge=1, le=50)
    units: list[str] = Field(default_factory=list)
    @field_validator(
        "subject",
        mode="before",
    )
    @classmethod
    def validate_strings(cls, value):
        return validate_text(value)

class QuizTemplateQuestionPublic(BaseModel):
    question_id: str
    question_text: str
    choices: List[str]

class QuizTemplateGenerateResponse(BaseModel):
    template_id: str
    questions: List[QuizTemplateQuestionPublic]

class QuizTemplateSubmitAnswer(BaseModel):
    question_id: str
    selected_index: int = Field(..., ge=0, le=3)

class QuizTemplateSubmitRequest(BaseModel):
    answers: List[QuizTemplateSubmitAnswer]

class QuizTemplateSubmitResponse(BaseModel):
    score: int
    max_score: int