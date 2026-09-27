from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class TransitionCandidate:
    stage_index: int
    strategy_id: str
    strategy_name: str
    time: int
    cost: float
    new_time: int
    new_cost: float
    feasible: bool
    reason: str


def generate_transitions(
    current_time: int,
    current_cost: float,
    stage_index: int,
    strategies: List[Dict[str, Any]],
    deadline: int,
    budget: float,
) -> List[TransitionCandidate]:
    candidates: List[TransitionCandidate] = []

    for strategy in strategies:
        strategy_id = str(
            strategy.get(
                "id",
                strategy.get("name", "strategy"),
            )
        )

        strategy_name = str(
            strategy.get(
                "name",
                strategy_id,
            )
        )

        strategy_time = int(strategy["time"])
        strategy_cost = float(strategy["cost"])

        new_time = current_time + strategy_time
        new_cost = current_cost + strategy_cost

        if new_time > deadline:
            feasible = False
            reason = "Deadline constraint violated."
        elif new_cost > budget:
            feasible = False
            reason = "Budget constraint violated."
        else:
            feasible = True
            reason = "Transition accepted."

        candidates.append(
            TransitionCandidate(
                stage_index=stage_index,
                strategy_id=strategy_id,
                strategy_name=strategy_name,
                time=strategy_time,
                cost=strategy_cost,
                new_time=new_time,
                new_cost=round(new_cost, 2),
                feasible=feasible,
                reason=reason,
            )
        )

    return candidates


def count_feasible_transitions(
    candidates: List[TransitionCandidate],
) -> int:
    return sum(
        1
        for candidate in candidates
        if candidate.feasible
    )