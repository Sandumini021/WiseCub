from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env", "../../.env"),
        extra="ignore",
    )

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    frontend_origin: str = "http://localhost:5173"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "wisecub"
    jwt_secret: str = "dev-only-change-me-use-a-long-env-secret"

    # Optional SMTP configuration for educational scam simulation emails
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@wisecub.org"
    smtp_use_tls: bool = True

    @property
    def is_smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_host.strip())

    @property
    def smtp_status_summary(self) -> dict[str, object]:
        return {
            "configured": self.is_smtp_configured,
            "host": self.smtp_host.strip() if self.smtp_host else None,
            "port": self.smtp_port,
            "from_email": self.smtp_from_email,
            "use_tls": self.smtp_use_tls,
            "auth_configured": bool(self.smtp_username and self.smtp_password),
        }

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
