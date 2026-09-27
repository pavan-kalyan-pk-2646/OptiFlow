from app.optimization.constraints.validator import (
    validate_constraints,
)


def test_valid_constraints():
    result = validate_constraints(
        total_time=20,
        total_cost=0.50,
        deadline=30,
        budget=1.00,
    )

    assert result.feasible is True
    assert result.time_valid is True
    assert result.cost_valid is True
    assert result.reason == "All constraints satisfied."


def test_exact_deadline_is_valid():
    result = validate_constraints(
        total_time=30,
        total_cost=0.50,
        deadline=30,
        budget=1.00,
    )

    assert result.feasible is True
    assert result.time_valid is True
    assert result.cost_valid is True


def test_exact_budget_is_valid():
    result = validate_constraints(
        total_time=20,
        total_cost=1.00,
        deadline=30,
        budget=1.00,
    )

    assert result.feasible is True
    assert result.time_valid is True
    assert result.cost_valid is True


def test_time_exceeding_deadline_is_invalid():
    result = validate_constraints(
        total_time=35,
        total_cost=0.50,
        deadline=30,
        budget=1.00,
    )

    assert result.feasible is False
    assert result.time_valid is False
    assert result.cost_valid is True

    assert (
        "Execution time 35 exceeds deadline 30."
        in result.reason
    )


def test_cost_exceeding_budget_is_invalid():
    result = validate_constraints(
        total_time=20,
        total_cost=1.50,
        deadline=30,
        budget=1.00,
    )

    assert result.feasible is False
    assert result.time_valid is True
    assert result.cost_valid is False

    assert (
        "Execution cost $1.50 exceeds budget $1.00."
        in result.reason
    )


def test_both_constraints_can_fail():
    result = validate_constraints(
        total_time=40,
        total_cost=2.00,
        deadline=30,
        budget=1.00,
    )

    assert result.feasible is False
    assert result.time_valid is False
    assert result.cost_valid is False

    assert "exceeds deadline" in result.reason
    assert "exceeds budget" in result.reason


def test_zero_values_are_valid_when_constraints_allow_them():
    result = validate_constraints(
        total_time=0,
        total_cost=0.0,
        deadline=30,
        budget=1.00,
    )

    assert result.feasible is True
    assert result.time_valid is True
    assert result.cost_valid is True


def test_small_floating_point_difference_is_allowed():
    result = validate_constraints(
        total_time=20,
        total_cost=1.0000000005,
        deadline=30,
        budget=1.00,
    )

    assert result.feasible is True
    assert result.cost_valid is True