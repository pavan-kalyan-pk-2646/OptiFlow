from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional


@dataclass
class DecisionStep:
    """
    Represents one decision selected while reconstructing
    the optimal Dynamic Programming path.
    """

    stage_index: int
    stage_id: str
    stage_name: str

    strategy_id: str
    strategy_name: str

    time: int
    cost: float

    cumulative_time: int
    cumulative_cost: float

    state_key: Optional[str] = None
    previous_state_key: Optional[str] = None


class DecisionTrace:
    """
    Stores the complete sequence of decisions that leads from
    the initial DP state to the optimal terminal state.
    """

    def __init__(self) -> None:
        self.steps: List[DecisionStep] = []

    def add_step(
        self,
        stage_index: int,
        stage_id: str,
        stage_name: str,
        strategy_id: str,
        strategy_name: str,
        time: int,
        cost: float,
        cumulative_time: int,
        cumulative_cost: float,
        state_key: Optional[str] = None,
        previous_state_key: Optional[str] = None,
    ) -> DecisionStep:

        step = DecisionStep(
            stage_index=stage_index,
            stage_id=stage_id,
            stage_name=stage_name,
            strategy_id=strategy_id,
            strategy_name=strategy_name,
            time=time,
            cost=round(float(cost), 2),
            cumulative_time=cumulative_time,
            cumulative_cost=round(float(cumulative_cost), 2),
            state_key=state_key,
            previous_state_key=previous_state_key,
        )

        self.steps.append(step)
        return step

    def clear(self) -> None:
        self.steps.clear()

    @property
    def count(self) -> int:
        return len(self.steps)

    @property
    def total_time(self) -> int:
        if not self.steps:
            return 0

        return self.steps[-1].cumulative_time

    @property
    def total_cost(self) -> float:
        if not self.steps:
            return 0.0

        return round(
            self.steps[-1].cumulative_cost,
            2,
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "steps": [
                asdict(step)
                for step in self.steps
            ],
            "count": self.count,
            "total_time": self.total_time,
            "total_cost": self.total_cost,
        }

    def to_list(self) -> List[Dict[str, Any]]:
        return [
            asdict(step)
            for step in self.steps
        ]


def build_decision_trace(
    decisions: List[Dict[str, Any]],
) -> DecisionTrace:
    """
    Build a DecisionTrace from reconstructed strategy decisions.

    Each decision may contain:
        stage_index
        stage_id
        stage_name
        strategy_id
        strategy_name
        time
        cost
        state_key
        previous_state_key
    """

    trace = DecisionTrace()

    cumulative_time = 0
    cumulative_cost = 0.0

    for index, decision in enumerate(decisions):
        stage_index = int(
            decision.get(
                "stage_index",
                index,
            )
        )

        stage_id = str(
            decision.get(
                "stage_id",
                stage_index,
            )
        )

        stage_name = str(
            decision.get(
                "stage_name",
                f"Stage {stage_index + 1}",
            )
        )

        strategy_id = str(
            decision.get(
                "strategy_id",
                decision.get(
                    "strategy_name",
                    f"strategy-{stage_index + 1}",
                ),
            )
        )

        strategy_name = str(
            decision.get(
                "strategy_name",
                strategy_id,
            )
        )

        time = int(
            decision.get(
                "time",
                0,
            )
        )

        cost = float(
            decision.get(
                "cost",
                0.0,
            )
        )

        cumulative_time += time
        cumulative_cost += cost

        trace.add_step(
            stage_index=stage_index,
            stage_id=stage_id,
            stage_name=stage_name,
            strategy_id=strategy_id,
            strategy_name=strategy_name,
            time=time,
            cost=cost,
            cumulative_time=cumulative_time,
            cumulative_cost=cumulative_cost,
            state_key=decision.get("state_key"),
            previous_state_key=decision.get(
                "previous_state_key"
            ),
        )

    return trace