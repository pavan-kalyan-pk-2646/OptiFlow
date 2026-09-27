from typing import Dict, List, Optional

from app.optimization.dp.state import DPState


def reconstruct_path(
    final_state: DPState,
    states: Dict[str, DPState],
) -> List[dict]:
    """
    Reconstruct the selected strategy sequence by following
    previous-state references from the final DP state.
    """

    path: List[dict] = []

    current: Optional[DPState] = final_state

    while current is not None:

        path.append(
            {
                "stage_index": current.stage_index,
                "time": current.time,
                "cost": round(
                    current.cost_cents / 100.0,
                    2,
                ),
                "score": round(
                    current.score,
                    6,
                ),
                "strategy_id": current.strategy_id,
            }
        )

        if current.previous_key is None:
            break

        current = states.get(
            current.previous_key
        )

    path.reverse()

    return path