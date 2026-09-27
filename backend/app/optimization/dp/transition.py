from dataclasses import dataclass
from typing import Optional

from .state import DPState


@dataclass
class DPTransition:
    """
    Records a transition between two DP states.
    """

    from_state: Optional[DPState]
    to_state: DPState
    strategy_id: str
    accepted: bool
    reason: str