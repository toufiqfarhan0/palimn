"""Application configuration and settings for PALIMN."""
from typing import List, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PALIMN_ENV: str = "development"
    APP_NAME: str = "PALIMN"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    BACKEND_CORS_ORIGINS: Union[List[str], str] = ["*"]

    # HydraDB Configuration
    HYDRA_MODE: str = "cloud"
    HYDRA_DB_API_KEY: str = ""
    HYDRA_DB_DATABASE: str = "palimn-memory"
    HYDRA_DB_BASE_URL: str = "https://api.hydradb.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    @property
    def is_hydra_configured(self) -> bool:
        """Check if HydraDB Cloud credentials are configured."""
        if not self.HYDRA_DB_BASE_URL or not self.HYDRA_DB_API_KEY:
            return False
        if "your_" in self.HYDRA_DB_API_KEY or "example" in self.HYDRA_DB_API_KEY:
            return False
        return True


settings = Settings()
