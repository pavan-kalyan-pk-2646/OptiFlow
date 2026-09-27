from dataclasses import dataclass
from typing import Dict, Optional, Tuple


StateKey = Tuple[int, int, int]


@dataclass
class TabulationEntry:
    stage_index: int
    time: int
    cost_cents: int
    score: float
    previous_key: Optional[StateKey] = None
    strategy_id: Optional[str] = None


class DPTabulation:
    """
    Sparse tabulation structure for OptiFlow's 3-dimensional
    pipeline DP state:

        (stage_index, time, cost)
    """

    def __init__(
        self,
        deadline: int,
        budget_cents: int,
    ) -> None:
        self.deadline = deadline
        self.budget_cents = budget_cents
        self.table: Dict[StateKey, TabulationEntry] = {}

    def put(
        self,
        stage_index: int,
        time: int,
        cost_cents: int,
        score: float,
        previous_key: Optional[StateKey] = None,
        strategy_id: Optional[str] = None,
    ) -> bool:
        if time > self.deadline:
            return False

        if cost_cents > self.budget_cents:
            return False

        key = (stage_index, time, cost_cents)
        existing = self.table.get(key)

        if existing is not None and existing.score <= score:
            return False

        self.table[key] = TabulationEntry(
            stage_index=stage_index,
            time=time,
            cost_cents=cost_cents,
            score=score,
            previous_key=previous_key,
            strategy_id=strategy_id,
        )

        return True

    def get(
        self,
        stage_index: int,
        time: int,
        cost_cents: int,
    ) -> Optional[TabulationEntry]:
        return self.table.get(
            (stage_index, time, cost_cents)
        )

    def states_at_stage(
        self,
        stage_index: int,
    ) -> Dict[StateKey, TabulationEntry]:
        return {
            key: value
            for key, value in self.table.items()
            if key[0] == stage_index
        }

    @property
    def states_stored(self) -> int:
        return len(self.table)

    def clear(self) -> None:
        self.table.clear()