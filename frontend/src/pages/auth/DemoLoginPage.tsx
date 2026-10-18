import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CubMascot } from "../../components/cub-assistant/CubMascot";
import { writeDemoChild } from "./demoSession";
import "../../styles/login-card.css";

function nameFromEmail(email: string) {
  const local = email.split("@")[0]?.trim() ?? "";
  return local || "Demo child";
}

export function DemoLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function enterDemo(label?: string) {
    const name = label ?? nameFromEmail(email);
    writeDemoChild(name);
    if (remember) {
      window.localStorage.setItem("wisecub.rememberMe", "1");
    }
    navigate("/home");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    enterDemo();
  }

  return (
    <div className="login-screen">
      <Link className="login-back" to="/home">
        ← Back to Home
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

        <form className="login-fields" onSubmit={onSubmit}>
          <label className="login-field">
            <span className="visually-hidden">Email address</span>
            <span className="login-ico" aria-hidden="true">
              ✉
            </span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              onClick={() =>
                setNote("This demo has no real passwords. Tap Login to continue as a practice child.")
              }
            >
              Forgot password?
            </button>
          </div>

          <button className="login-submit" type="submit">
            Login
          </button>
        </form>

        <p className="login-or">or continue with</p>

        <div className="login-social">
          <button type="button" onClick={() => enterDemo("Google demo")}>
            <span className="g-icon" aria-hidden="true">
              G
            </span>
            Google
          </button>
          <button type="button" onClick={() => enterDemo("Microsoft demo")}>
            <span className="ms-icon" aria-hidden="true">
              ⊞
            </span>
            Microsoft
          </button>
          <button type="button" onClick={() => enterDemo("Apple demo")}>
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
        <p className="login-note">Practice login only. No real accounts, banks, or cards.</p>
      </main>
    </div>
  );
}
