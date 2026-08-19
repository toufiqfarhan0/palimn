"""Dataset loader, normalizer, and strict oracle isolation for LongMemEval_S."""
import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.app.benchmark.models import (
    LongMemEvalMessage,
    LongMemEvalQuestion,
    LongMemEvalRecord,
    LongMemEvalSession,
)

logger = logging.getLogger("palimn.longmemeval_loader")

# Candidate default dataset locations
DEFAULT_DATASET_PATHS = [
    Path("temp_datasets/longmemeval_s_cleaned.json"),
    Path("temp_datasets/longmemeval_s.json"),
    Path("data/longmemeval_s_cleaned.json"),
    Path("data/longmemeval_s.json"),
    Path("benchmark/data/longmemeval_s_cleaned.json"),
]


def resolve_dataset_path(custom_path: Optional[str] = None) -> Path:
    """Resolve absolute or relative path to LongMemEval_S JSON file."""
    if custom_path:
        p = Path(custom_path)
        if p.is_file():
            return p.resolve()
        raise FileNotFoundError(f"Specified LongMemEval dataset file not found: {custom_path}")

    for candidate in DEFAULT_DATASET_PATHS:
        if candidate.is_file():
            return candidate.resolve()

    raise FileNotFoundError(
        "LongMemEval_S dataset file not found. Checked: "
        + ", ".join(str(p) for p in DEFAULT_DATASET_PATHS)
    )


def normalize_date_string(raw_date: str) -> str:
    """Normalize LongMemEval date format '2023/05/10 (Wed) 10:15' to sortable ISO format."""
    cleaned = raw_date.strip()
    match = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s*(?:\([A-Za-z]+\))?\s*(\d{1,2}):(\d{2})", cleaned)
    if match:
        year, month, day, hour, minute = match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}T{int(hour):02d}:{int(minute):02d}:00"
    
    date_only = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", cleaned)
    if date_only:
        year, month, day = date_only.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}T00:00:00"
    
    return cleaned


def normalize_raw_record(raw: Dict[str, Any]) -> LongMemEvalRecord:
    """Convert raw LongMemEval JSON object into validated LongMemEvalRecord domain model."""
    question_id = str(raw.get("question_id", "unknown_qid"))
    question_type = str(raw.get("question_type", "unspecified"))
    question_text = str(raw.get("question", ""))
    question_date = str(raw.get("question_date", ""))
    user_id = f"user_{question_id}"

    haystack_sessions = raw.get("haystack_sessions", [])
    haystack_dates = raw.get("haystack_dates", [])
    haystack_session_ids = raw.get("haystack_session_ids", [])

    # Build and chronologically order session objects
    unnormalized_sessions: List[Tuple[str, LongMemEvalSession]] = []
    
    for s_idx, session_turns in enumerate(haystack_sessions):
        raw_s_id = (
            haystack_session_ids[s_idx]
            if s_idx < len(haystack_session_ids)
            else f"sess_{question_id}_{s_idx:03d}"
        )
        raw_date = (
            haystack_dates[s_idx]
            if s_idx < len(haystack_dates)
            else "2023/01/01 00:00"
        )
        norm_date = normalize_date_string(raw_date)

        # Parse messages
        messages: List[LongMemEvalMessage] = []
        for m_idx, turn in enumerate(session_turns):
            m_id = f"msg_{question_id}_s{s_idx:03d}_m{m_idx:03d}"
            role = str(turn.get("role", "user")).lower()
            content = str(turn.get("content", ""))
            has_answer = turn.get("has_answer")

            messages.append(
                LongMemEvalMessage(
                    message_id=m_id,
                    role=role,
                    content=content,
                    timestamp=norm_date,
                    has_answer=bool(has_answer) if has_answer is not None else None,
                )
            )

        session_obj = LongMemEvalSession(
            session_id=raw_s_id,
            session_index=s_idx,
            date=norm_date,
            raw_date=raw_date,
            messages=messages,
        )
        unnormalized_sessions.append((norm_date, session_obj))

    # Sort strictly by normalized chronological date
    unnormalized_sessions.sort(key=lambda x: x[0])
    
    # Re-assign sequential session index based on true chronological ordering
    ordered_sessions: List[LongMemEvalSession] = []
    for new_idx, (_, s_obj) in enumerate(unnormalized_sessions):
        s_obj.session_index = new_idx + 1
        ordered_sessions.append(s_obj)

    return LongMemEvalRecord(
        question_id=question_id,
        question_type=question_type,
        question=question_text,
        question_date=question_date,
        user_id=user_id,
        sessions=ordered_sessions,
        answer=raw.get("answer"),
        answer_session_ids=raw.get("answer_session_ids", []),
    )


class LongMemEvalLoader:
    """Thread-safe loader for LongMemEval_S records with lazy normalization."""

    def __init__(self, dataset_path: Optional[str] = None):
        self.path = resolve_dataset_path(dataset_path)
        self._raw_data: Optional[List[Dict[str, Any]]] = None
        self._records_cache: Dict[str, LongMemEvalRecord] = {}

    def _load_raw_data(self) -> List[Dict[str, Any]]:
        """Load raw JSON list from file once."""
        if self._raw_data is None:
            logger.info("Loading raw LongMemEval_S JSON from %s", self.path)
            with open(self.path, "r", encoding="utf-8") as f:
                self._raw_data = json.load(f)
        return self._raw_data

    def load_records(self, limit: Optional[int] = None) -> List[LongMemEvalRecord]:
        """Load and normalize records up to optional limit."""
        raw_list = self._load_raw_data()
        target_list = raw_list[:limit] if limit is not None else raw_list
        results: List[LongMemEvalRecord] = []
        for raw_item in target_list:
            qid = str(raw_item.get("question_id"))
            if qid not in self._records_cache:
                self._records_cache[qid] = normalize_raw_record(raw_item)
            results.append(self._records_cache[qid])
        return results

    def load_all_records(self) -> List[LongMemEvalRecord]:
        """Load and normalize all 500 records."""
        return self.load_records()

    def get_record_by_id(self, question_id: str) -> Optional[LongMemEvalRecord]:
        """Retrieve and normalize a single record by question_id on demand."""
        if question_id in self._records_cache:
            return self._records_cache[question_id]

        raw_list = self._load_raw_data()
        for raw_item in raw_list:
            if str(raw_item.get("question_id")) == question_id:
                record = normalize_raw_record(raw_item)
                self._records_cache[question_id] = record
                return record
        return None

    def get_sample_record(self, index: int = 0) -> LongMemEvalRecord:
        """Retrieve record at specific index."""
        raw_list = self._load_raw_data()
        if 0 <= index < len(raw_list):
            raw_item = raw_list[index]
            qid = str(raw_item.get("question_id"))
            if qid not in self._records_cache:
                self._records_cache[qid] = normalize_raw_record(raw_item)
            return self._records_cache[qid]
        raise IndexError(f"Index {index} out of range for dataset of size {len(raw_list)}")
