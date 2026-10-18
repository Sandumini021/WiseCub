from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    frontend_origin: str = "http://localhost:5173"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "wisecub"
    jwt_secret: str = "dev-only-change-me-use-a-long-env-secret"

    @property
    def cors_origins(self) -> list[str]:
        extra = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
        ]
        origins = [self.frontend_origin, *extra]
        return list(dict.fromkeys(origins))


settings = Settings()
