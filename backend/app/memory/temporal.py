"""Temporal expression grounding and validity interval computation."""
from datetime import datetime, timezone
from typing import Optional, Tuple


class TemporalGrounder:
    """Grounds relative and absolute temporal expressions into ISO valid_from / valid_until ranges."""

    def ground_temporal_expression(
        self,
        text: str,
        reference_time: Optional[str] = None,
    ) -> Tuple[Optional[str], Optional[str]]:
        """Compute (valid_from, valid_until) timestamp range."""
        ref = reference_time or datetime.now(timezone.utc).isoformat()
        return (ref, None)
