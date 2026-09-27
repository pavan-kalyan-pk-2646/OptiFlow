from typing import Dict, List, Set


def validate_stage_order(
    stages: List[Dict],
) -> None:
    """
    Validate that pipeline stages have a valid ordered sequence.

    OptiFlow V1 models the pipeline as an ordered sequence.
    It does not solve arbitrary DAG scheduling.
    """
    expected_order = list(range(len(stages)))

    actual_order = []

    for index, stage in enumerate(stages):
        stage_index = stage.get("index", index)
        actual_order.append(int(stage_index))

    if actual_order != expected_order:
        raise ValueError(
            "Pipeline stages must form a valid ordered sequence."
        )


def validate_dependencies(
    stages: List[Dict],
) -> None:
    """
    Validate simple stage-to-stage dependencies.

    A dependency must point to an earlier stage.
    """
    stage_ids: Set[str] = set()

    for index, stage in enumerate(stages):
        stage_id = str(stage.get("id", index))
        stage_ids.add(stage_id)

    for index, stage in enumerate(stages):
        dependencies = stage.get("dependencies", [])

        if dependencies is None:
            continue

        if not isinstance(dependencies, list):
            raise ValueError(
                f"Dependencies for stage {index + 1} must be a list."
            )

        current_id = str(stage.get("id", index))

        for dependency in dependencies:
            dependency_id = str(dependency)

            if dependency_id not in stage_ids:
                raise ValueError(
                    f"Stage '{current_id}' depends on unknown "
                    f"stage '{dependency_id}'."
                )

            if dependency_id == current_id:
                raise ValueError(
                    f"Stage '{current_id}' cannot depend on itself."
                )


def dependencies_satisfied(
    completed_stage_ids: Set[str],
    dependencies: List[str],
) -> bool:
    """
    Check whether all required dependencies have been completed.
    """
    return all(
        str(dependency) in completed_stage_ids
        for dependency in dependencies
    )