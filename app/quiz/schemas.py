from pydantic import BaseModel
from typing import List, Optional

# This is just the “data forms” going/coming back from the API (so that there is a clear Contract for the team).
class GenerateQuizRequest(BaseModel):
    student_id: int
    conversation_id: Optional[str] = None
    n_questions: int = 10
    topic: Optional[str] = None  # optional

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
    selected_index: int

class SubmitQuizRequest(BaseModel):
    quiz_id: str
    student_id: int
    started_at: Optional[str] = None  # ISO string اختياري
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
