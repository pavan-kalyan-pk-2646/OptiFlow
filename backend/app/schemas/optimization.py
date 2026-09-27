from typing import Literal

from pydantic import BaseModel, Field, field_validator


ObjectiveType = Literal["time", "cost", "balanced"]


class OptimizationStrategy(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    time: int = Field(ge=0)
    cost: float = Field(ge=0)


class OptimizationStage(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    strategies: list[OptimizationStrategy] = Field(min_length=1)

    @field_validator("strategies")
    @classmethod
    def validate_strategies(
        cls,
        value: list[OptimizationStrategy],
    ) -> list[OptimizationStrategy]:
        if not value:
            raise ValueError("Each stage must contain at least one strategy.")

        ids = [strategy.id for strategy in value]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Strategy IDs must be unique within a stage."
            )

        return value


class OptimizationRequest(BaseModel):
    stages: list[OptimizationStage] = Field(min_length=1)
    deadline: int = Field(gt=0)
    budget: float = Field(ge=0)
    objective: ObjectiveType = "balanced"

    @field_validator("stages")
    @classmethod
    def validate_stages(
        cls,
        value: list[OptimizationStage],
    ) -> list[OptimizationStage]:
        if not value:
            raise ValueError("At least one pipeline stage is required.")

        ids = [stage.id for stage in value]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Stage IDs must be unique."
            )

        return value


class StageOptimizationResult(BaseModel):
    stage_id: str
    stage_name: str
    strategy_id: str
    strategy_name: str
    time: int
    cost: float


class ReconstructionState(BaseModel):
    stage_index: int
    time: int
    cost: float
    score: float
    strategy_id: str | None


class DPModel(BaseModel):
    state: str
    transition: str
    constraints: list[str]
    objective: ObjectiveType


class OptimizationResponse(BaseModel):
    success: bool
    message: str
    objective: ObjectiveType

    total_time: int
    total_cost: float
    score: float

    selected_strategies: list[str]

    stage_results: list[StageOptimizationResult]

    states_generated: int
    transitions_evaluated: int
    states_pruned: int
    total_states_stored: int

    reconstruction: list[ReconstructionState]

    dp_model: DPModel