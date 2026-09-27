from typing import Union


Number = Union[int, float]


def normalize_budget(budget: Number) -> float:
    """
    Normalize a budget value into a non-negative float.
    """
    value = float(budget)

    if value < 0:
        raise ValueError("Budget cannot be negative.")

    return round(value, 2)


def is_within_budget(
    total_cost: Number,
    budget: Number,
) -> bool:
    """
    Check whether total pipeline cost satisfies the budget constraint.
    """
    return float(total_cost) <= normalize_budget(budget)


def remaining_budget(
    total_cost: Number,
    budget: Number,
) -> float:
    """
    Return the remaining available budget.
    """
    remaining = normalize_budget(budget) - float(total_cost)
    return round(max(0.0, remaining), 2)


def validate_budget(
    total_cost: Number,
    budget: Number,
) -> None:
    """
    Raise ValueError when the budget constraint is violated.
    """
    if not is_within_budget(total_cost, budget):
        raise ValueError(
            f"Budget constraint violated: "
            f"cost={float(total_cost):.2f}, "
            f"budget={normalize_budget(budget):.2f}"
        )