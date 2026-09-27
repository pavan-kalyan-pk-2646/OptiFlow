from typing import Any, Callable, Dict, Hashable, Tuple


MemoKey = Tuple[Hashable, ...]


class MemoizationEngine:
    """
    Generic memoization engine for Dynamic Programming experiments.
    """

    def __init__(self) -> None:
        self.cache: Dict[MemoKey, Any] = {}
        self.calls = 0
        self.cache_hits = 0

    def get(
        self,
        key: MemoKey,
        compute: Callable[[], Any],
    ) -> Any:
        self.calls += 1

        if key in self.cache:
            self.cache_hits += 1
            return self.cache[key]

        value = compute()
        self.cache[key] = value
        return value

    def clear(self) -> None:
        self.cache.clear()
        self.calls = 0
        self.cache_hits = 0

    @property
    def states_stored(self) -> int:
        return len(self.cache)

    @property
    def hit_rate(self) -> float:
        if self.calls == 0:
            return 0.0

        return self.cache_hits / self.calls


def memoize(
    function: Callable[..., Any],
) -> Callable[..., Any]:
    """
    Lightweight function memoization decorator.
    """
    cache: Dict[Tuple[Any, ...], Any] = {}

    def wrapper(*args: Any, **kwargs: Any) -> Any:
        key = (
            args,
            tuple(sorted(kwargs.items())),
        )

        if key not in cache:
            cache[key] = function(*args, **kwargs)

        return cache[key]

    return wrapper