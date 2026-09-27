from typing import Dict, Optional


def validate_resources(
    resources: Optional[Dict[str, float]],
    limits: Optional[Dict[str, float]],
) -> bool:
    """
    Validate optional resource constraints.

    Resource constraints are auxiliary validation for V1.
    The core V1 DP objective remains time/cost optimization.
    """
    if not resources or not limits:
        return True

    for resource_name, used_value in resources.items():
        if resource_name not in limits:
            continue

        limit = float(limits[resource_name])

        if float(used_value) > limit:
            return False

    return True


def resource_usage(
    resources: Optional[Dict[str, float]],
    limits: Optional[Dict[str, float]],
) -> Dict[str, Dict[str, float]]:
    """
    Return resource usage together with configured limits.
    """
    resources = resources or {}
    limits = limits or {}

    result: Dict[str, Dict[str, float]] = {}

    names = set(resources) | set(limits)

    for name in names:
        used = float(resources.get(name, 0.0))
        limit = float(limits.get(name, 0.0))

        result[name] = {
            "used": used,
            "limit": limit,
            "remaining": max(0.0, limit - used),
        }

    return result


def validate_resource_value(
    resource_name: str,
    value: float,
    limit: float,
) -> None:
    """
    Validate one resource value against its limit.
    """
    if float(value) > float(limit):
        raise ValueError(
            f"Resource constraint violated for '{resource_name}': "
            f"value={float(value)}, limit={float(limit)}"
        )