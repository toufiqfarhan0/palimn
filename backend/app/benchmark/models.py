"""Domain models for LongMemEval_S benchmark dataset, evaluation results, and aggregate metrics."""
from datetime import datetime
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
    question_type: str
    question_date: str
    prediction: Optional[str] = None
    decision: str  # "answerable" | "abstain"
    confidence: float
    retrieved_memory_ids: List[str] = Field(default_factory=list)
    retrieved_session_ids: List[str] = Field(default_factory=list)
    evidence_count: int = 0
    top_1_recall: bool = False
    top_5_recall: bool = False
    top_10_recall: bool = False
    top_20_recall: bool = False
    # Post-Retrieval Evaluation Comparison Fields
    expected_answer: Optional[Union[str, int, float]] = None
    exact_match: bool = False
    partial_match: bool = False
    is_abstention: bool = False
    abstention_correct: bool = False
    failure_category: Optional[str] = None
    # Latency Breakdown
    query_analysis_latency_ms: float = 0.0
    retrieval_latency_ms: float = 0.0
    extraction_latency_ms: float = 0.0
    total_latency_ms: float = 0.0

    @property
    def latency_ms(self) -> float:
        return self.total_latency_ms


class BenchmarkAggregateMetrics(BaseModel):
    """Comprehensive benchmark aggregate evaluation metrics."""
    total_questions: int = 0
    exact_match_count: int = 0
    exact_match_accuracy: float = 0.0
    answerable_count: int = 0
    abstention_count: int = 0
    true_positives: int = 0
    false_abstentions: int = 0
    false_answers: int = 0
    correct_abstentions: int = 0
    false_abstention_rate: float = 0.0
    false_answer_rate: float = 0.0
    abstention_accuracy: float = 0.0
    recall_at_1: float = 0.0
    recall_at_5: float = 0.0
    recall_at_10: float = 0.0
    recall_at_20: float = 0.0
    avg_latency_ms: float = 0.0
    p50_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    max_latency_ms: float = 0.0


class BenchmarkRunReport(BaseModel):
    """Complete serialized benchmark report artifact."""
    dataset: str = "LongMemEval_S"
    limit: int
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    metrics: BenchmarkAggregateMetrics
    by_question_type: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    failure_categories: Dict[str, int] = Field(default_factory=dict)
    database_growth: Dict[str, int] = Field(default_factory=dict)
    questions: List[EvaluationResult] = Field(default_factory=list)
