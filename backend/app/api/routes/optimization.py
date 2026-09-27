from fastapi import APIRouter, HTTPException

from app.optimization.dp.solver import (
    DPPipelineSolver,
    StageInput,
    StrategyInput,
)

from app.schemas.optimization import (
    OptimizationRequest,
    OptimizationResponse,
    StageOptimizationResult,
    ReconstructionState,
    DPModel,
)


router = APIRouter(
    prefix="/optimization",
    tags=["Optimization"],
)


def get_value(item, key, default=None):
    """
    Supports both dictionaries and objects/dataclasses.
    """
    if isinstance(item, dict):
        return item.get(key, default)

    return getattr(item, key, default)


@router.post(
    "/run",
    response_model=OptimizationResponse,
)
def run_optimization(
    request: OptimizationRequest,
) -> OptimizationResponse:

    try:
        # =========================================================
        # 1. Convert API request into DP engine input
        # =========================================================

        stages = [
            StageInput(
                id=stage.id,
                name=stage.name,
                strategies=[
                    StrategyInput(
                        id=strategy.id,
                        name=strategy.name,
                        time=strategy.time,
                        cost=strategy.cost,
                    )
                    for strategy in stage.strategies
                ],
            )
            for stage in request.stages
        ]

        # =========================================================
        # 2. Create DP Pipeline Solver
        # =========================================================

        solver = DPPipelineSolver(
            stages=stages,
            deadline=request.deadline,
            budget=request.budget,
            objective=request.objective,
        )

        # =========================================================
        # 3. Run Dynamic Programming
        # =========================================================

        solution = solver.solve()

        # =========================================================
        # 4. Convert stage results
        # =========================================================

        stage_results = []

        for item in solution.stage_results:
            stage_results.append(
                StageOptimizationResult(
                    stage_id=str(
                        get_value(
                            item,
                            "stage_id",
                            "",
                        )
                    ),
                    stage_name=str(
                        get_value(
                            item,
                            "stage_name",
                            "",
                        )
                    ),
                    strategy_id=str(
                        get_value(
                            item,
                            "strategy_id",
                            "",
                        )
                    ),
                    strategy_name=str(
                        get_value(
                            item,
                            "strategy_name",
                            "",
                        )
                    ),
                    time=int(
                        get_value(
                            item,
                            "time",
                            0,
                        )
                    ),
                    cost=float(
                        get_value(
                            item,
                            "cost",
                            0.0,
                        )
                    ),
                    cumulative_time=int(
                        get_value(
                            item,
                            "cumulative_time",
                            get_value(
                                item,
                                "time",
                                0,
                            ),
                        )
                    ),
                    cumulative_cost=float(
                        get_value(
                            item,
                            "cumulative_cost",
                            get_value(
                                item,
                                "cost",
                                0.0,
                            ),
                        )
                    ),
                )
            )

        # =========================================================
        # 5. Convert DP reconstruction
        # =========================================================

        reconstruction = []

        for item in solution.reconstruction:

            strategy_id = get_value(
                item,
                "strategy_id",
                None,
            )

            reconstruction.append(
                ReconstructionState(
                    stage_index=int(
                        get_value(
                            item,
                            "stage_index",
                            0,
                        )
                    ),
                    stage_id=str(
                        get_value(
                            item,
                            "stage_id",
                            "",
                        )
                    ),
                    stage_name=str(
                        get_value(
                            item,
                            "stage_name",
                            "",
                        )
                    ),
                    strategy_id=(
                        str(strategy_id)
                        if strategy_id is not None
                        else None
                    ),
                    strategy_name=str(
                        get_value(
                            item,
                            "strategy_name",
                            "",
                        )
                    ),
                    time=int(
                        get_value(
                            item,
                            "time",
                            0,
                        )
                    ),
                    cost=float(
                        get_value(
                            item,
                            "cost",
                            0.0,
                        )
                    ),
                    score=float(
                        get_value(
                            item,
                            "score",
                            0.0,
                        )
                    ),
                    cumulative_time=int(
                        get_value(
                            item,
                            "cumulative_time",
                            get_value(
                                item,
                                "time",
                                0,
                            ),
                        )
                    ),
                    cumulative_cost=float(
                        get_value(
                            item,
                            "cumulative_cost",
                            get_value(
                                item,
                                "cost",
                                0.0,
                            ),
                        )
                    ),
                    state_key=get_value(
                        item,
                        "state_key",
                        None,
                    ),
                    previous_state_key=get_value(
                        item,
                        "previous_state_key",
                        None,
                    ),
                )
            )

        # =========================================================
        # 6. Build frontend-compatible DP model
        # =========================================================

        dp_data = solution.dp_model

        dp_state = dp_data.get(
            "state",
            dp_data.get(
                "state_definition",
                "DP[i][time][cost]",
            ),
        )

        dp_transition = dp_data.get(
            "transition",
            dp_data.get(
                "transition_rule",
                "Select exactly one strategy for the next stage.",
            ),
        )

        dp_constraints = dp_data.get(
            "constraints",
            [
                f"time <= {request.deadline}",
                f"cost <= {request.budget:.2f}",
            ],
        )

        dp_objective = dp_data.get(
            "objective",
            request.objective,
        )

        dp_model = DPModel(
            state=dp_state,
            transition=dp_transition,
            constraints=dp_constraints,
            objective=dp_objective,
        )

        # =========================================================
        # 7. Final optimization response
        # =========================================================

        return OptimizationResponse(
            success=bool(
                get_value(
                    solution,
                    "success",
                    True,
                )
            ),
            message=str(
                get_value(
                    solution,
                    "message",
                    "Optimization completed successfully.",
                )
            ),
            objective=request.objective,

            total_time=int(
                get_value(
                    solution,
                    "total_time",
                    0,
                )
            ),

            total_cost=float(
                get_value(
                    solution,
                    "total_cost",
                    0.0,
                )
            ),

            score=float(
                get_value(
                    solution,
                    "score",
                    0.0,
                )
            ),

            selected_strategies=list(
                get_value(
                    solution,
                    "selected_strategies",
                    [],
                )
            ),

            stage_results=stage_results,

            states_generated=int(
                get_value(
                    solution,
                    "states_generated",
                    0,
                )
            ),

            transitions_evaluated=int(
                get_value(
                    solution,
                    "transitions_evaluated",
                    0,
                )
            ),

            states_pruned=int(
                get_value(
                    solution,
                    "states_pruned",
                    0,
                )
            ),

            total_states_stored=int(
                get_value(
                    solution,
                    "total_states_stored",
                    0,
                )
            ),

            reconstruction=reconstruction,

            dp_model=dp_model,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {str(exc)}",
        ) from exc