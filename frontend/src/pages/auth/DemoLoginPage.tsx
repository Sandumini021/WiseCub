import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CubMascot } from "../../components/cub-assistant/CubMascot";
import { ApiError, loginAccount } from "../../services/apiClient";
import { applyRemoteSession } from "./demoSession";
import { homePathForRole } from "./roles";
import "../../styles/login-card.css";

export function DemoLoginPage() {
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
      setNote("Enter your username or email, and your password.");
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
        setNote("Could not log in. Start MongoDB and the API, then try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <Link className="login-back" to="/">
        ← Back
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

        <h1>Welcome Back!</h1>
        <p className="login-lead">Login to continue your learning journey</p>

        <form className="login-fields" onSubmit={(event) => void onSubmit(event)}>
          <label className="login-field">
            <span className="visually-hidden">Username or email</span>
            <span className="login-ico" aria-hidden="true">
              ✉
            </span>
            <input
              name="username"
              autoComplete="username"
              placeholder="Username or email"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </label>

          <label className="login-field">
            <span className="visually-hidden">Password</span>
            <span className="login-ico" aria-hidden="true">
              🔒
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="login-eye"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
              Remember me
            </label>
            <button
              className="login-text-btn"
              type="button"
              onClick={() => setNote("Password reset is not built yet. Ask a teammate if you are stuck.")}
            >
              Forgot password?
            </button>
          </div>

          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? "Checking…" : "Login"}
          </button>
        </form>

        <p className="login-or">or continue with</p>

        <div className="login-social">
          <button type="button" onClick={() => setNote("Google sign-in is not enabled in this practice app.")}>
            <span className="g-icon" aria-hidden="true">
              G
            </span>
            Google
          </button>
          <button
            type="button"
            onClick={() => setNote("Microsoft sign-in is not enabled in this practice app.")}
          >
            <span className="ms-icon" aria-hidden="true">
              ⊞
            </span>
            Microsoft
          </button>
          <button type="button" onClick={() => setNote("Apple sign-in is not enabled in this practice app.")}>
            <span className="ap-icon" aria-hidden="true">
              
            </span>
            Apple
          </button>
        </div>

        <p className="login-signup">
          Don’t have an account?{" "}
          <Link className="login-text-btn" to="/signup">
            Create one
          </Link>
        </p>
        {note ? <p className="login-note">{note}</p> : null}
        <p className="login-note">
          Practice login. Passwords are hashed on the server. Students use a username. Teachers and
          guardians may use email. Not a bank.
        </p>
      </main>
    </div>
  );
}
