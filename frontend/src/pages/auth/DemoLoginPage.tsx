import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CubMascot } from "../../components/cub-assistant/CubMascot";
import { LanguageSelect } from "../../components/layout/LanguageSelect";
import { useLang } from "../../i18n/useLang";
import { ApiError, loginAccount } from "../../services/apiClient";
import { applyRemoteSession } from "./demoSession";
import { homePathForRole } from "./roles";
import "../../styles/login-card.css";

export function DemoLoginPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setNote(t("login.needFields"));
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const account = await loginAccount(identifier.trim(), password, remember);
      if (remember) {
        window.localStorage.setItem("wisecub.rememberMe", "1");
      }
      const saved = applyRemoteSession(account);
      navigate(homePathForRole(saved.role));
    } catch (error) {
      if (error instanceof ApiError) {
        setNote(error.message);
      } else {
        setNote(t("login.fail"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-lang">
        <LanguageSelect />
      </div>
      <Link className="login-back" to="/">
        {t("login.back")}
      </Link>

      <main id="main" className="login-card">
        <div className="login-mark">
          <span className="login-face">
            <CubMascot size={64} />
          </span>
          <p className="login-wordmark">
            Wise<span>Cub</span>
          </p>
        </div>

        <h1>{t("login.title")}</h1>
        <p className="login-lead">{t("login.lead")}</p>

        <form className="login-fields" onSubmit={(event) => void onSubmit(event)}>
          <label className="login-field">
            <span className="visually-hidden">{t("login.user")}</span>
            <span className="login-ico" aria-hidden="true">
              ✉
            </span>
            <input
              name="username"
              autoComplete="username"
              placeholder={t("login.user")}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </label>

          <label className="login-field">
            <span className="visually-hidden">{t("login.password")}</span>
            <span className="login-ico" aria-hidden="true">
              🔒
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder={t("login.password")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="login-eye"
              type="button"
              aria-label={showPassword ? t("login.hide") : t("login.show")}
              onClick={() => setShowPassword((open) => !open)}
            >
              👁
            </button>
          </label>

          <div className="login-row-tools">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              {t("login.remember")}
            </label>
            <button
              className="login-text-btn"
              type="button"
              onClick={() => setNote(t("login.forgotNote"))}
            >
              {t("login.forgot")}
            </button>
          </div>

          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? t("login.checking") : t("login.submit")}
          </button>
        </form>

        <p className="login-or">{t("login.or")}</p>

        <div className="login-social">
          <button type="button" onClick={() => setNote(t("login.google"))}>
            <span className="g-icon" aria-hidden="true">
              G
            </span>
            Google
          </button>
          <button
            type="button"
            onClick={() => setNote(t("login.microsoft"))}
          >
            <span className="ms-icon" aria-hidden="true">
              ⊞
            </span>
            Microsoft
          </button>
          <button type="button" onClick={() => setNote(t("login.apple"))}>
            <span className="ap-icon" aria-hidden="true">
              
            </span>
            Apple
          </button>
        </div>

        <p className="login-signup">
          {t("login.needAccount")}{" "}
          <Link className="login-text-btn" to="/signup">
            {t("login.create")}
          </Link>
        </p>
        {note ? <p className="login-note">{note}</p> : null}
        <p className="login-note">{t("login.practice")}</p>
      </main>
    </div>
  );
}
