import os
from dotenv import load_dotenv

from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=Path(Path(__file__).resolve().parent.parent.parent) / ".env"
    )

    # database related
    DATABASE_URL: str

    # JWT Token Related
    SECRET_KEY: str
    REFRESH_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_MINUTES: int


settings = Settings()
