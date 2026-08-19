"""Domain models for LongMemEval_S benchmark dataset and evaluation results."""
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class LongMemEvalMessage(BaseModel):
    """Normalized turn within a LongMemEval conversation session."""
    message_id: str = Field(..., description="Deterministic message identifier")
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Raw text of the conversation turn")
    timestamp: Optional[str] = Field(None, description="Timestamp if present")
    # Evaluation oracle metadata (MUST NEVER be used in retrieval)
    has_answer: Optional[bool] = Field(None, description="Oracle evidence flag for evaluation only")


class LongMemEvalSession(BaseModel):
    """Normalized session container within LongMemEval haystack."""
    session_id: str = Field(..., description="Deterministic or raw session ID")
    session_index: int = Field(..., description="Chronological index 0..N")
    date: str = Field(..., description="Normalized date string (YYYY/MM/DD HH:MM)")
    raw_date: str = Field(..., description="Original raw date string from dataset")
    messages: List[LongMemEvalMessage] = Field(default_factory=list)


class LongMemEvalQuestion(BaseModel):
    """Evaluation query extracted from LongMemEval record."""
    question_id: str = Field(..., description="Unique question identifier")
    question: str = Field(..., description="Question prompt to test long-term memory")
    question_date: str = Field(..., description="Timestamp of the question turn")
    question_type: str = Field(..., description="Category: single-session-user, temporal-reasoning, etc.")


class LongMemEvalRecord(BaseModel):
    """Complete parsed and normalized LongMemEval_S evaluation record."""
    question_id: str
    question_type: str
    question: str
    question_date: str
    user_id: str = "user_demo"
    sessions: List[LongMemEvalSession] = Field(default_factory=list)
    # Oracle Evaluation Fields (Strictly isolated from Retrieval Engine)
    answer: Optional[Union[str, int, float]] = Field(None, description="Gold answer for evaluation only")
    answer_session_ids: List[str] = Field(default_factory=list, description="Gold evidence session IDs for evaluation only")


class EvaluationResult(BaseModel):
    """Isolated evaluation output comparing retrieval prediction against gold target."""
    question_id: str
    question: str
    prediction: Optional[str] = None
    decision: str  # "answerable" | "abstain"
    confidence: float
    retrieved_memory_ids: List[str] = Field(default_factory=list)
    retrieved_session_ids: List[str] = Field(default_factory=list)
    latency_ms: float
    # Post-Retrieval Evaluation Comparison Fields
    expected_answer: Optional[Union[str, int, float]] = None
    question_type: Optional[str] = None
    exact_match: Optional[bool] = None
    is_abstention: Optional[bool] = None
    abstention_correct: Optional[bool] = None
