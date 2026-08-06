from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Provider API keys (all optional — router skips providers with no key configured)
    openai_api_key: str | None = None
    smallest_api_key: str | None = None
    sarvam_api_key: str | None = None
    gemini_api_key: str | None = None

    # CORS (comma-separated list of allowed origins)
    frontend_origins: str = "http://localhost:3000,http://localhost:3002"

    # Paths
    base_dir: Path = Path(__file__).resolve().parent.parent
    data_dir: Path = base_dir / "data"
    storage_dir: Path = base_dir / "storage"


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
settings.storage_dir.mkdir(parents=True, exist_ok=True)
