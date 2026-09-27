
from typing import Any, Dict, List


def brute_force_optimize(
    stages: List[Dict[str, Any]],
    deadline: int,
    budget: float,
    objective: str = "balanced",
) -> Dict[str, Any]:
    best = None
    operation_count = 0
    feasible_count = 0

    def score(total_time: int, total_cost: float) -> float:
        if objective == "time":
            return float(total_time)

        if objective == "cost":
            return float(total_cost)

        return (0.65 * float(total_time)) + (0.35 * float(total_cost))

    def search(
        index: int,
        total_time: int,
        total_cost: float,
        selected: List[Dict[str, Any]],
    ) -> None:
        nonlocal best, operation_count, feasible_count

        operation_count += 1

        if total_time > deadline or total_cost > budget:
            return

        if index == len(stages):
            feasible_count += 1
            current_score = score(total_time, total_cost)

            if best is None or current_score < best["score"]:
                best = {
                    "score": current_score,
                    "total_time": total_time,
                    "total_cost": round(total_cost, 2),
                    "selected_strategies": list(selected),
                }
            return

        stage = stages[index]

        for strategy in stage.get("strategies", []):
            strategy_time = int(strategy["time"])
            strategy_cost = float(strategy["cost"])

            selected.append(
                {
                    "stage_id": stage.get("id", str(index + 1)),
                    "stage_name": stage.get(
                        "name",
                        f"Stage {index + 1}",
                    ),
                    "strategy_id": strategy.get(
                        "id",
                        strategy.get("name", f"strategy-{index + 1}"),
                    ),
                    "strategy_name": strategy.get(
                        "name",
                        strategy.get("id", f"Strategy {index + 1}"),
                    ),
                    "time": strategy_time,
                    "cost": strategy_cost,
                }
            )

            search(
                index + 1,
                total_time + strategy_time,
                total_cost + strategy_cost,
                selected,
            )

            selected.pop()

    search(0, 0, 0.0, [])

    if best is None:
        return {
            "success": False,
            "message": "No feasible configuration satisfies the constraints.",
            "operation_count": operation_count,
            "feasible_count": feasible_count,
            "selected_strategies": [],
        }

    return {
        "success": True,
        "message": "Brute-force optimization completed.",
        "score": round(best["score"], 6),
        "total_time": best["total_time"],
        "total_cost": best["total_cost"],
        "selected_strategies": best["selected_strategies"],
        "operation_count": operation_count,
        "feasible_count": feasible_count,
    }
