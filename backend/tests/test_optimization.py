import pytest

from app.optimization.dp.solver import (
    DPPipelineSolver,
    StageInput,
    StrategyInput,
)


def make_stages():
    return [
        StageInput(
            id="build",
            name="BUILD",
            strategies=[
                StrategyInput(
                    id="build-standard",
                    name="Standard",
                    time=8,
                    cost=0.08,
                ),
                StrategyInput(
                    id="build-fast",
                    name="Fast",
                    time=5,
                    cost=0.15,
                ),
                StrategyInput(
                    id="build-power",
                    name="High Power",
                    time=3,
                    cost=0.25,
                ),
            ],
        ),
        StageInput(
            id="test",
            name="TEST",
            strategies=[
                StrategyInput(
                    id="test-standard",
                    name="Standard",
                    time=12,
                    cost=0.14,
                ),
                StrategyInput(
                    id="test-parallel",
                    name="Parallel",
                    time=7,
                    cost=0.24,
                ),
                StrategyInput(
                    id="test-power",
                    name="High Power",
                    time=5,
                    cost=0.35,
                ),
            ],
        ),
        StageInput(
            id="deploy",
            name="DEPLOY",
            strategies=[
                StrategyInput(
                    id="deploy-standard",
                    name="Standard",
                    time=10,
                    cost=0.10,
                ),
                StrategyInput(
                    id="deploy-fast",
                    name="Fast",
                    time=6,
                    cost=0.18,
                ),
            ],
        ),
    ]


def test_solver_finds_feasible_solution():
    stages = make_stages()

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    result = solver.solve()

    assert result.success is True
    assert result.total_time <= 30
    assert result.total_cost <= 1.00
    assert len(result.selected_strategies) == 3


def test_solver_time_objective():
    stages = make_stages()

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="time",
    )

    result = solver.solve()

    assert result.success is True
    assert result.objective == "time"
    assert result.total_time <= 30
    assert result.total_cost <= 1.00


def test_solver_cost_objective():
    stages = make_stages()

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="cost",
    )

    result = solver.solve()

    assert result.success is True
    assert result.objective == "cost"
    assert result.total_time <= 30
    assert result.total_cost <= 1.00


def test_solver_balanced_objective():
    stages = make_stages()

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    result = solver.solve()

    assert result.success is True
    assert result.objective == "balanced"


def test_solver_reconstruction():
    stages = make_stages()

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    result = solver.solve()

    assert result.success is True

    reconstruction = result.reconstruction

    # Initial state + one state for every pipeline stage.
    assert len(reconstruction) == len(stages) + 1

    # Initial state.
    assert reconstruction[0]["stage_index"] == 0
    assert reconstruction[0]["strategy_id"] is None
    assert reconstruction[0]["time"] == 0
    assert reconstruction[0]["cost"] == 0.0

    # Every actual stage must have a selected strategy.
    for index, stage in enumerate(stages, start=1):
        state = reconstruction[index]

        assert state["stage_index"] == index
        assert state["strategy_id"] is not None

        valid_strategy_ids = {
            strategy.id for strategy in stage.strategies
        }

        assert state["strategy_id"] in valid_strategy_ids


def test_solver_statistics_are_generated():
    stages = make_stages()

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    result = solver.solve()

    assert result.success is True
    assert result.states_generated > 0
    assert result.transitions_evaluated > 0
    assert result.total_states_stored > 0
    assert result.states_pruned >= 0


def test_solver_dp_model():
    stages = make_stages()

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    result = solver.solve()

    assert result.success is True

    assert result.dp_model["state"] == "DP[i][time][cost]"

    assert (
        result.dp_model["transition"]
        == "Select exactly one strategy for the next pipeline stage."
    )

    assert result.dp_model["constraints"] == [
        "time <= deadline",
        "cost <= budget",
    ]

    assert result.dp_model["objective"] == "balanced"


def test_solver_configuration_count():
    stages = make_stages()

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    result = solver.solve()

    # 3 strategies × 3 strategies × 2 strategies = 18.
    assert result.total_possible_configurations == 18


def test_impossible_constraints_return_failure():
    stages = make_stages()

    solver = DPPipelineSolver(
        stages=stages,
        deadline=1,
        budget=0.01,
        objective="balanced",
    )

    result = solver.solve()

    assert result.success is False

    assert (
        result.message
        == "No feasible pipeline configuration satisfies "
        "the deadline and budget."
    )

    assert result.selected_strategies == []
    assert result.total_time == 0
    assert result.total_cost == 0.0


def test_empty_pipeline_is_rejected():
    solver = DPPipelineSolver(
        stages=[],
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    with pytest.raises(
        ValueError,
        match="At least one pipeline stage is required.",
    ):
        solver.solve()


def test_zero_deadline_is_rejected():
    solver = DPPipelineSolver(
        stages=make_stages(),
        deadline=0,
        budget=1.00,
        objective="balanced",
    )

    with pytest.raises(
        ValueError,
        match="Deadline must be greater than zero.",
    ):
        solver.solve()


def test_negative_budget_is_rejected():
    solver = DPPipelineSolver(
        stages=make_stages(),
        deadline=30,
        budget=-1.00,
        objective="balanced",
    )

    with pytest.raises(
        ValueError,
        match="Budget cannot be negative.",
    ):
        solver.solve()


def test_invalid_objective_is_rejected():
    solver = DPPipelineSolver(
        stages=make_stages(),
        deadline=30,
        budget=1.00,
        objective="invalid",
    )

    with pytest.raises(
        ValueError,
        match="Objective must be one of: time, cost, balanced.",
    ):
        solver.solve()


def test_stage_without_strategy_is_rejected():
    stages = [
        StageInput(
            id="build",
            name="BUILD",
            strategies=[],
        )
    ]

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    with pytest.raises(
        ValueError,
        match="must have at least one strategy",
    ):
        solver.solve()


def test_invalid_strategy_time_is_rejected():
    stages = [
        StageInput(
            id="build",
            name="BUILD",
            strategies=[
                StrategyInput(
                    id="bad-time",
                    name="Bad Time",
                    time=0,
                    cost=0.10,
                )
            ],
        )
    ]

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    with pytest.raises(
        ValueError,
        match="must have positive execution time",
    ):
        solver.solve()


def test_negative_strategy_cost_is_rejected():
    stages = [
        StageInput(
            id="build",
            name="BUILD",
            strategies=[
                StrategyInput(
                    id="bad-cost",
                    name="Bad Cost",
                    time=5,
                    cost=-0.10,
                )
            ],
        )
    ]

    solver = DPPipelineSolver(
        stages=stages,
        deadline=30,
        budget=1.00,
        objective="balanced",
    )

    with pytest.raises(
        ValueError,
        match="cannot have negative cost",
    ):
        solver.solve()