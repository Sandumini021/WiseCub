import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CubMascot } from "../../components/cub-assistant/CubMascot";
import { loadAccountByEmail, loadAccountByUsername } from "../../services/apiClient";
import { setChildId, writeDemoChild } from "./demoSession";
import { homePathForRole, isAccountRole, normalizeUsername } from "./roles";
import "../../styles/login-card.css";

function nameFromEmail(email: string) {
  const local = email.split("@")[0]?.trim() ?? "";
  return local || "Demo child";
}

export function DemoLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function finishLogin(name: string, extras?: Parameters<typeof writeDemoChild>[1]) {
    const saved = writeDemoChild(name, extras);
    if (remember) {
      window.localStorage.setItem("wisecub.rememberMe", "1");
    }
    navigate(homePathForRole(saved.role));
  }

  async function enterDemo(label?: string) {
    const raw = identifier.trim();
    const asEmail = raw.includes("@") ? raw.toLowerCase() : "";
    const asUser = asEmail ? "" : normalizeUsername(raw);
    try {
      const account = asEmail
        ? await loadAccountByEmail(asEmail)
        : asUser
          ? await loadAccountByUsername(asUser)
          : null;
      if (account) {
        if (account.child_id) {
          setChildId(account.child_id);
        }
        finishLogin(account.name || label || nameFromEmail(raw), {
          email: account.email,
          username: account.username,
          role: isAccountRole(account.role) ? account.role : "student",
          age: account.age,
          gender: account.gender,
          avatarId: account.avatar_id,
          language: account.language,
          classCode: account.class_code,
          institution: account.institution,
          enteredAt: account.entered_at,
        });
        return;
      }
    } catch {
      // Practice login still works if Mongo is down or the name is new.
    }
    finishLogin(label ?? (asEmail ? nameFromEmail(asEmail) : raw || "Demo child"), {
      email: asEmail || undefined,
      username: asUser || undefined,
      role: "student",
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!identifier.trim()) {
      setNote("Enter your username (students) or email (teachers and guardians).");
      return;
    }
    void enterDemo();
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

        <form className="login-fields" onSubmit={onSubmit}>
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
              onClick={() =>
                setNote("This demo has no real passwords. Tap Login to continue.")
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
        <p className="login-note">Demo login only. Passwords are not checked yet. No real accounts, banks, or cards.</p>
      </main>
    </div>
  );
}
