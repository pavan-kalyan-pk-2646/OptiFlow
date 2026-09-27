
from dataclasses import dataclass
from typing import Any, Callable, Dict, List
from statistics import median
from time import perf_counter


@dataclass
class BenchmarkResult:
    algorithm: str
    stages: int
    runs: int
    median_runtime_ms: float
    operation_count: int


def benchmark_algorithm(
    algorithm_name: str,
    runner: Callable[[int], Any],
    stage_count: int,
    runs: int = 5,
) -> BenchmarkResult:
    if runs < 1:
        raise ValueError("runs must be at least 1")

    # Warm-up
    runner(stage_count)

    timings: List[float] = []
    operation_count = 0

    for _ in range(runs):
        start = perf_counter()
        result = runner(stage_count)
        elapsed = (perf_counter() - start) * 1000.0
        timings.append(elapsed)

        if isinstance(result, dict):
            operation_count = int(
                result.get(
                    "operation_count",
                    result.get("operations", operation_count),
                )
            )

    return BenchmarkResult(
        algorithm=algorithm_name,
        stages=stage_count,
        runs=runs,
        median_runtime_ms=round(median(timings), 6),
        operation_count=operation_count,
    )


def run_benchmark_suite(
    algorithms: Dict[str, Callable[[int], Any]],
    stage_sizes: List[int],
    runs: int = 5,
) -> List[BenchmarkResult]:
    results: List[BenchmarkResult] = []

    for stage_count in stage_sizes:
        for algorithm_name, runner in algorithms.items():
            results.append(
                benchmark_algorithm(
                    algorithm_name=algorithm_name,
                    runner=runner,
                    stage_count=stage_count,
                    runs=runs,
                )
            )

    return results
