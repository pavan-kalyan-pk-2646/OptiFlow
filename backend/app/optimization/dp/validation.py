from dataclasses import dataclass


@dataclass
class ConstraintResult:
    feasible: bool
    time_valid: bool
    cost_valid: bool
    reason: str


def validate_constraints(
    total_time: int,
    total_cost: float,
    deadline: int,
    budget: float,
) -> ConstraintResult:

    time_valid = total_time <= deadline
    cost_valid = total_cost <= budget

    if time_valid and cost_valid:
        return ConstraintResult(
            feasible=True,
            time_valid=True,
            cost_valid=True,
            reason="All constraints satisfied.",
        )

    reasons = []

    if not time_valid:
        reasons.append(
            f"Execution time {total_time} exceeds "
            f"deadline {deadline}."
        )

    if not cost_valid:
        reasons.append(
            f"Execution cost ${total_cost:.2f} exceeds "
            f"budget ${budget:.2f}."
        )

    return ConstraintResult(
        feasible=False,
        time_valid=time_valid,
        cost_valid=cost_valid,
        reason=" ".join(reasons),
    )