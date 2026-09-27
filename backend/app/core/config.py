import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "OptiFlow API"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = (
        "postgresql://postgres:postgres@localhost:5432/optiflow"
    )

    JWT_SECRET_KEY: str = (
        "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_security_configuration(self):
        placeholder_secrets = {
            "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY",
            "optiflow-super-secret-change-this-later",
        }

        environment = os.getenv(
            "ENVIRONMENT",
            "development",
        ).lower()

        if (
            environment in {"production", "prod"}
            and self.JWT_SECRET_KEY in placeholder_secrets
        ):
            raise ValueError(
                "JWT_SECRET_KEY must be changed before "
                "running OptiFlow in production."
            )

        if len(self.JWT_SECRET_KEY) < 32:
            if environment in {"production", "prod"}:
                raise ValueError(
                    "JWT_SECRET_KEY must contain at least "
                    "32 characters in production."
                )

        if self.ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
            raise ValueError(
                "ACCESS_TOKEN_EXPIRE_MINUTES must be greater than zero."
            )

        return self


settings = Settings()