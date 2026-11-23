from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    max_upload_size_mb: int = Field(20, gt=0)
    max_image_pixels: int = Field(25_000_000, gt=0)
    max_image_dimension: int = Field(8000, gt=0)
    storage_dir: Path = Path("storage")
    file_retention_hours: float = Field(24, gt=0)
    cors_origins: str = "http://localhost:3000"
    rembg_model: str = "isnet-general-use"
    max_concurrent_jobs: int = Field(2, gt=0)

    @field_validator("cors_origins")
    @classmethod
    def no_wildcard(cls, v: str) -> str:
        if "*" in v:
            raise ValueError("CORS_ORIGINS must list explicit origins")
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


# Invalid env vars raise here, so the app fails fast at startup.
settings = Settings()
