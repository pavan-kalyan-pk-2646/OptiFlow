from dataclasses import dataclass
from math import prod
from typing import Dict, List, Optional, Tuple

from .state import DPState


@dataclass(frozen=True)
class StrategyInput:
    id: str
    name: str
    time: int
    cost: float


@dataclass(frozen=True)
class StageInput:
    id: str
    name: str
    strategies: List[StrategyInput]


@dataclass(frozen=True)
class DPSolution:
    success: bool
    message: str

    objective: str

    total_time: int
    total_cost: float
    score: float

    selected_strategies: List[str]

    stage_results: List[dict]

    states_generated: int
    transitions_evaluated: int
    states_pruned: int
    total_states_stored: int

    reconstruction: List[dict]

    dp_model: dict

    total_possible_configurations: int


class DPPipelineSolver:
    """
    Dynamic Programming solver for OptiFlow V1.

    Problem model:

        Select exactly one strategy for each stage.

    Every strategy has:

        time
        cost

    Hard constraints:

        total_time <= deadline
        total_cost <= budget

    Objectives:

        time
        cost
        balanced

    DP state:

        DP[i][time][cost]

    where i represents the number of stages processed.
    """

    def __init__(
        self,
        stages: List[StageInput],
        deadline: int,
        budget: float,
        objective: str,
    ) -> None:
        self.stages = stages
        self.deadline = deadline
        self.budget = budget
        self.objective = objective

        self.budget_cents = self._money_to_cents(budget)

        self.states: Dict[str, DPState] = {}

        self.states_generated = 0
        self.transitions_evaluated = 0
        self.states_pruned = 0

    # =========================================================
    # PUBLIC SOLVER
    # =========================================================

    def solve(self) -> DPSolution:
        self._validate_input()

        total_configurations = self._calculate_configuration_count()

        if not self.stages:
            return DPSolution(
                success=False,
                message="Pipeline must contain at least one stage.",
                objective=self.objective,
                total_time=0,
                total_cost=0.0,
                score=0.0,
                selected_strategies=[],
                stage_results=[],
                states_generated=0,
                transitions_evaluated=0,
                states_pruned=0,
                total_states_stored=0,
                reconstruction=[],
                dp_model=self._dp_model(),
                total_possible_configurations=0,
            )

        # -----------------------------------------------------
        # Initial state
        # -----------------------------------------------------

        initial_state = DPState(
            stage_index=0,
            time=0,
            cost_cents=0,
            score=0.0,
            previous_key=None,
            strategy_id=None,
        )

        self.states[initial_state.key] = initial_state

        current_states: Dict[Tuple[int, int], DPState] = {
            (0, 0): initial_state
        }

        # -----------------------------------------------------
        # Process every stage
        # -----------------------------------------------------

        for stage_index, stage in enumerate(self.stages, start=1):

            next_states: Dict[Tuple[int, int], DPState] = {}

            for previous_state in current_states.values():

                for strategy in stage.strategies:

                    self.transitions_evaluated += 1

                    next_time = (
                        previous_state.time +
                        strategy.time
                    )

                    strategy_cost_cents = self._money_to_cents(
                        strategy.cost
                    )

                    next_cost_cents = (
                        previous_state.cost_cents +
                        strategy_cost_cents
                    )

                    # -----------------------------------------
                    # Hard constraint pruning
                    # -----------------------------------------

                    if next_time > self.deadline:
                        self.states_pruned += 1
                        continue

                    if next_cost_cents > self.budget_cents:
                        self.states_pruned += 1
                        continue

                    next_score = self._calculate_score(
                        next_time,
                        next_cost_cents,
                    )

                    candidate = DPState(
                        stage_index=stage_index,
                        time=next_time,
                        cost_cents=next_cost_cents,
                        score=next_score,
                        previous_key=previous_state.key,
                        strategy_id=strategy.id,
                    )

                    self.states_generated += 1

                    state_dimension = (
                        next_time,
                        next_cost_cents,
                    )

                    existing = next_states.get(
                        state_dimension
                    )

                    # -------------------------------------------------
                    # Dominance for identical time/cost dimensions
                    #
                    # For the same stage, same accumulated time,
                    # and same accumulated cost, only the state with
                    # the better objective score is needed.
                    # -------------------------------------------------

                    if existing is None:
                        next_states[state_dimension] = candidate

                    elif candidate.score < existing.score:
                        next_states[state_dimension] = candidate

                # End strategy loop

            # End previous-state loop

            if not next_states:
                return DPSolution(
                    success=False,
                    message=(
                        "No feasible pipeline configuration "
                        "satisfies the deadline and budget."
                    ),
                    objective=self.objective,
                    total_time=0,
                    total_cost=0.0,
                    score=0.0,
                    selected_strategies=[],
                    stage_results=[],
                    states_generated=self.states_generated,
                    transitions_evaluated=self.transitions_evaluated,
                    states_pruned=self.states_pruned,
                    total_states_stored=len(self.states),
                    reconstruction=[],
                    dp_model=self._dp_model(),
                    total_possible_configurations=total_configurations,
                )

            current_states = next_states

            # Store reachable states for reconstruction.
            for state in current_states.values():
                self.states[state.key] = state

        # -----------------------------------------------------
        # Find optimal final state
        # -----------------------------------------------------

        final_state = min(
            current_states.values(),
            key=lambda state: (
                state.score,
                state.time,
                state.cost_cents,
            ),
        )

        reconstruction = self._reconstruct(final_state)

        selected_strategies = [
            item["strategy_id"]
            for item in reconstruction
            if item["strategy_id"] is not None
        ]

        stage_results = self._build_stage_results(
            selected_strategies
        )

        return DPSolution(
            success=True,
            message="Optimal pipeline configuration found.",
            objective=self.objective,
            total_time=final_state.time,
            total_cost=round(
                final_state.cost_cents / 100.0,
                2,
            ),
            score=round(final_state.score, 6),
            selected_strategies=selected_strategies,
            stage_results=stage_results,
            states_generated=self.states_generated,
            transitions_evaluated=self.transitions_evaluated,
            states_pruned=self.states_pruned,
            total_states_stored=len(self.states),
            reconstruction=reconstruction,
            dp_model=self._dp_model(),
            total_possible_configurations=total_configurations,
        )

    # =========================================================
    # INPUT VALIDATION
    # =========================================================

    def _validate_input(self) -> None:

        if self.deadline <= 0:
            raise ValueError(
                "Deadline must be greater than zero."
            )

        if self.budget < 0:
            raise ValueError(
                "Budget cannot be negative."
            )

        if self.objective not in {
            "time",
            "cost",
            "balanced",
        }:
            raise ValueError(
                "Objective must be one of: "
                "time, cost, balanced."
            )

        if not self.stages:
            raise ValueError(
                "At least one pipeline stage is required."
            )

        for stage in self.stages:

            if not stage.id.strip():
                raise ValueError(
                    "Every stage must have an id."
                )

            if not stage.name.strip():
                raise ValueError(
                    "Every stage must have a name."
                )

            if not stage.strategies:
                raise ValueError(
                    f"Stage '{stage.name}' must have "
                    "at least one strategy."
                )

            for strategy in stage.strategies:

                if not strategy.id.strip():
                    raise ValueError(
                        f"Strategy in stage '{stage.name}' "
                        "must have an id."
                    )

                if strategy.time <= 0:
                    raise ValueError(
                        f"Strategy '{strategy.name}' must have "
                        "positive execution time."
                    )

                if strategy.cost < 0:
                    raise ValueError(
                        f"Strategy '{strategy.name}' cannot "
                        "have negative cost."
                    )

    # =========================================================
    # OBJECTIVE
    # =========================================================

    def _calculate_score(
        self,
        total_time: int,
        total_cost_cents: int,
    ) -> float:

        normalized_time = (
            total_time /
            max(self.deadline, 1)
        )

        normalized_cost = (
            (total_cost_cents / 100.0) /
            max(self.budget, 0.01)
        )

        if self.objective == "time":
            return normalized_time

        if self.objective == "cost":
            return normalized_cost

        # Balanced objective:
        #
        # 65% execution time
        # 35% execution cost
        #
        # This matches the objective model used
        # by the OptiFlow frontend.

        return (
            normalized_time * 0.65 +
            normalized_cost * 0.35
        )

    # =========================================================
    # RECONSTRUCTION
    # =========================================================

    def _reconstruct(
        self,
        final_state: DPState,
    ) -> List[dict]:

        path: List[dict] = []

        current: Optional[DPState] = final_state

        while current is not None:

            path.append(
                {
                    "stage_index": current.stage_index,
                    "time": current.time,
                    "cost": round(
                        current.cost_cents / 100.0,
                        2,
                    ),
                    "score": round(
                        current.score,
                        6,
                    ),
                    "strategy_id": current.strategy_id,
                }
            )

            if current.previous_key is None:
                break

            current = self.states.get(
                current.previous_key
            )

        path.reverse()

        return path

    # =========================================================
    # STAGE RESULT
    # =========================================================

    def _build_stage_results(
        self,
        selected_strategies: List[str],
    ) -> List[dict]:

        results: List[dict] = []

        for stage, strategy_id in zip(
            self.stages,
            selected_strategies,
        ):

            strategy = next(
                (
                    item
                    for item in stage.strategies
                    if item.id == strategy_id
                ),
                None,
            )

            if strategy is None:
                continue

            results.append(
                {
                    "stage_id": stage.id,
                    "stage_name": stage.name,
                    "strategy_id": strategy.id,
                    "strategy_name": strategy.name,
                    "time": strategy.time,
                    "cost": round(
                        strategy.cost,
                        2,
                    ),
                }
            )

        return results

    # =========================================================
    # CONFIGURATION COUNT
    # =========================================================

    def _calculate_configuration_count(self) -> int:

        strategy_counts = [
            len(stage.strategies)
            for stage in self.stages
        ]

        if not strategy_counts:
            return 0

        return prod(strategy_counts)

    # =========================================================
    # DP MODEL DESCRIPTION
    # =========================================================

    def _dp_model(self) -> dict:

        return {
            "state": "DP[i][time][cost]",
            "transition": (
                "Select exactly one strategy for the "
                "next pipeline stage."
            ),
            "constraints": [
                "time <= deadline",
                "cost <= budget",
            ],
            "objective": self.objective,
        }

    # =========================================================
    # MONEY
    # =========================================================

    @staticmethod
    def _money_to_cents(
        value: float,
    ) -> int:

        return int(
            round(
                float(value) * 100
            )
        )


def solve_pipeline(
    stages: List[StageInput],
    deadline: int,
    budget: float,
    objective: str,
) -> DPSolution:

    solver = DPPipelineSolver(
        stages=stages,
        deadline=deadline,
        budget=budget,
        objective=objective,
    )

    return solver.solve()