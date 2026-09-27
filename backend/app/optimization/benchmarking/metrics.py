
from typing import Any, Dict, Iterable, List


def calculate_speedup(
    baseline_ms: float,
    optimized_ms: float,
) -> float:
    if optimized_ms <= 0:
        return 0.0

    return round(baseline_ms / optimized_ms, 4)


def calculate_reduction(
    baseline: int,
    optimized: int,
) -> float:
    if baseline <= 0:
        return 0.0

    return round(
        ((baseline - optimized) / baseline) * 100.0,
        4,
    )


def summarize_benchmark_results(
    results: Iterable[Any],
) -> List[Dict[str, Any]]:
    summary: List[Dict[str, Any]] = []

    for result in results:
        if hasattr(result, "__dict__"):
            summary.append(dict(result.__dict__))
        elif isinstance(result, dict):
            summary.append(dict(result))

    return summary


def compare_algorithms(
    results: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    grouped: Dict[int, List[Dict[str, Any]]] = {}

    for result in results:
        stages = int(result["stages"])
        grouped.setdefault(stages, []).append(result)

    output: List[Dict[str, Any]] = []

    for stages, items in grouped.items():
        baseline = next(
            (
                item
                for item in items
                if item["algorithm"].lower() in {
                    "brute force",
                    "bruteforce",
                    "brute_force",
                }
            ),
            None,
        )

        for item in items:
            row = dict(item)
            row["stages"] = stages

            if baseline and item is not baseline:
                row["speedup_vs_bruteforce"] = calculate_speedup(
                    float(baseline["median_runtime_ms"]),
                    float(item["median_runtime_ms"]),
                )

                row["operation_reduction_vs_bruteforce"] = calculate_reduction(
                    int(baseline["operation_count"]),
                    int(item["operation_count"]),
                )

            output.append(row)

    return output
