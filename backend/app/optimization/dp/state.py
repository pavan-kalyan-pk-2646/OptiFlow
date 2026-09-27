from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class DPState:
    """
    Represents one reachable DP state.

    A state is uniquely identified by:
        stage_index
        accumulated_time
        accumulated_cost_cents

    Cost is stored internally as integer cents to avoid
    floating-point precision problems.
    """

    stage_index: int
    time: int
    cost_cents: int
    score: float
    previous_key: Optional[str] = None
    strategy_id: Optional[str] = None

    @property
    def cost(self) -> float:
        return self.cost_cents / 100.0

    @property
    def key(self) -> str:
        return (
            f"{self.stage_index}:"
            f"{self.time}:"
            f"{self.cost_cents}"
        )