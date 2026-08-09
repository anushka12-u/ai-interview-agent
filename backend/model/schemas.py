from pydantic import BaseModel
class InterviewRequest(BaseModel):
    candidate_id: str
    # job_position removed: candidate_id is sufficient to identify the role

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

class InterviewResponse(BaseModel):
    session_id: str
    question: str
    question_number: int
    day: int | None = None
    topic: str | None = None

class FeedbackResponse(BaseModel):
    overall_score: float
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]