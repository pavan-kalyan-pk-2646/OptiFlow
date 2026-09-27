from dataclasses import dataclass


@dataclass(frozen=True)
class RecurrenceDefinition:
    """
    Describes the recurrence used by an OptiFlow DP model.
    """

    state_definition: str
    transition: str
    base_case: str
    objective: str


PIPELINE_RECURRENCE = RecurrenceDefinition(
    state_definition=(
        "DP[i][t][c] represents the best score reachable "
        "after processing the first i stages using t time "
        "and c cost."
    ),
    transition=(
        "DP[i+1][t+dt][c+dc] = best("
        "DP[i+1][t+dt][c+dc], "
        "DP[i][t][c] + strategy_score"
        ")"
    ),
    base_case=(
        "DP[0][0][0] = 0; "
        "all other initial states are unreachable."
    ),
    objective=(
        "Select the feasible terminal state with the minimum "
        "objective score."
    ),
)


def describe_recurrence() -> dict:
    return {
        "state_definition": PIPELINE_RECURRENCE.state_definition,
        "transition": PIPELINE_RECURRENCE.transition,
        "base_case": PIPELINE_RECURRENCE.base_case,
        "objective": PIPELINE_RECURRENCE.objective,
    }


def validate_recurrence(
    stage_count: int,
    deadline: int,
    budget_cents: int,
) -> None:
    if stage_count < 0:
        raise ValueError("Stage count cannot be negative.")

    if deadline < 0:
        raise ValueError("Deadline cannot be negative.")

    if budget_cents < 0:
        raise ValueError("Budget cannot be negative.")