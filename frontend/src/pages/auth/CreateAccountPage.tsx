import { useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CubMascot } from "../../components/cub-assistant/CubMascot";
import { ApiError, checkUsername } from "../../services/apiClient";
import { ChildAvatar } from "./ChildAvatar";
import { PRACTICE_AVATARS } from "./avatars";
import { writeSignupProfile } from "./demoSession";
import { LANGUAGES, normalizeUsername, type AccountRole, homePathForRole } from "./roles";
import "../../styles/signup.css";

const AGES = ["12", "13", "14", "15", "16"];
type Step = "role" | "details" | "avatar" | "done";

const ROLES: Array<{ id: AccountRole; title: string; blurb: string }> = [
  { id: "student", title: "Student", blurb: "Learn with Cub. Ages 12–16." },
  { id: "teacher", title: "Teacher", blurb: "Create classes and follow progress." },
  { id: "guardian", title: "Parent / Guardian", blurb: "See a linked child’s learning, not their login." },
];

export function CreateAccountPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<AccountRole | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [language, setLanguage] = useState("en");
  const [classCode, setClassCode] = useState("");
  const [institution, setInstitution] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [avatarId, setAvatarId] = useState<(typeof PRACTICE_AVATARS)[number]["id"]>("kid-sky");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function commonPasswordOk() {
    if (password.length < 6) {
      setError("Choose a password with at least 6 characters.");
      return false;
    }
    if (password !== confirm) {
      setError("Password and confirm password must match.");
      return false;
    }
    if (!terms) {
      setError("Please agree to the Terms of Service to continue.");
      return false;
    }
    return true;
  }

  async function onDetails(event: FormEvent) {
    event.preventDefault();
    if (!role) {
      setError("Pick Student, Teacher, or Parent/Guardian first.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const user = normalizeUsername(username);
    if (user.length < 3) {
      setError("Choose a username with at least 3 letters or numbers.");
      return;
    }
    if (role === "student" && !age) {
      setError("Please select your age (12–16).");
      return;
    }
    if (role !== "student" && (!email.trim() || !email.includes("@"))) {
      setError("Teachers and guardians need an email for this demo account.");
      return;
    }
    if (!commonPasswordOk()) {
      return;
    }
    try {
      const check = await checkUsername(user);
      if (check.taken) {
        setSuggestions(check.suggestions);
        setError("That username is already in use. Try one of these:");
        return;
      }
    } catch {
      // Mongo down: still allow labelled demo signup.
    }
    setError(null);
    setSuggestions([]);
    setUsername(user);
    if (role === "student") {
      setStep("avatar");
      return;
    }
    await finishSignup(role, user);
  }

  async function finishSignup(nextRole: AccountRole, user = username) {
    try {
      await writeSignupProfile({
        name,
        email: nextRole === "student" ? undefined : email,
        username: user,
        password,
        role: nextRole,
        age: nextRole === "student" ? age : undefined,
        avatarId: nextRole === "student" ? avatarId : undefined,
        language,
        classCode: nextRole === "student" ? classCode : undefined,
        institution: nextRole === "teacher" ? institution : undefined,
      });
      setPassword("");
      setConfirm("");
      setStep("done");
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.detail;
        if (detail && typeof detail === "object" && "suggestions" in detail) {
          const extra = (detail as { suggestions?: string[] }).suggestions ?? [];
          setSuggestions(extra);
        }
        setError(err.message);
        return;
      }
      setError("Could not create the account. The API did not accept this page origin — refresh and try again.");
    }
  }

  function completeStudent() {
    if (!role) {
      return;
    }
    void finishSignup(role);
  }

  const stepIndex = step === "role" ? 0 : step === "details" ? 1 : step === "avatar" ? 2 : 3;

  return (
    <div className="signup-screen">
      <div className="signup-card">
        <aside className="signup-hero" aria-hidden="true">
          <div className="signup-brand">
            <span className="signup-brand-face">
              <CubMascot size={42} />
            </span>
            <p>
              Wise<span>Cub</span>
            </p>
          </div>
          <h1>Create Your Account</h1>
          <p className="signup-hero-lead">Pick how you will use WiseCub. Demo accounts only.</p>
          <div className="signup-cub-stage">
            <span className="signup-float signup-bulb">💡</span>
            <span className="signup-float signup-chart">📈</span>
            <span className="signup-float signup-plane">✈️</span>
            <CubMascot size={210} />
            <div className="signup-books">
              <span className="signup-book is-green">Learn</span>
              <span className="signup-book is-gold">Invest</span>
              <span className="signup-book is-blue">Save</span>
              <span className="signup-book is-purple">Stay Safe</span>
            </div>
          </div>
          <blockquote>
            “Small steps today, bigger dreams tomorrow!”
            <cite>— WiseCub</cite>
          </blockquote>
        </aside>

        <section className="signup-pane" id="main">
          <p className="signup-demo-flag">Practice accounts. Passwords are hashed on the server. Not a bank.</p>
          <ol className="signup-steps" aria-label="Account setup steps">
            <li className={stepIndex === 0 ? "is-current" : "is-done"}>
              <span>1</span>
              Role
            </li>
            <li className={stepIndex === 1 ? "is-current" : stepIndex > 1 ? "is-done" : ""}>
              <span>2</span>
              Details
            </li>
            <li className={stepIndex === 2 ? "is-current" : stepIndex > 2 ? "is-done" : ""}>
              <span>3</span>
              {role === "student" ? "Avatar" : "Done"}
            </li>
          </ol>

          {step === "role" ? (
            <div className="signup-form">
              <h2>Who is this account for?</h2>
              <p className="signup-sub">This chooses your form and your dashboard.</p>
              <div className="signup-roles">
                {ROLES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`signup-role${role === item.id ? " is-on" : ""}`}
                    onClick={() => setRole(item.id)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.blurb}</span>
                  </button>
                ))}
              </div>
              {error ? <p className="signup-error">{error}</p> : null}
              <button
                className="signup-next"
                type="button"
                onClick={() => {
                  if (!role) {
                    setError("Please choose Student, Teacher, or Parent/Guardian.");
                    return;
                  }
                  setError(null);
                  setStep("details");
                }}
              >
                Next →
              </button>
              <p className="signup-login">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          ) : null}

          {step === "details" ? (
            <form className="signup-form" onSubmit={(event) => void onDetails(event)}>
              <h2>{role === "teacher" ? "Teacher details" : role === "guardian" ? "Guardian details" : "Student details"}</h2>
              <p className="signup-sub">
                {role === "student"
                  ? "No email needed. Cub will know you by your username."
                  : "Teacher and guardian accounts are demo / unverified in this increment."}
              </p>

              <div className="signup-grid">
                <label className="signup-field">
                  <span>
                    Full Name <em>*</em>
                  </span>
                  <span className="signup-control">
                    <UserIcon />
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </span>
                </label>

                <label className="signup-field">
                  <span>
                    Username <em>*</em>
                  </span>
                  <span className="signup-control">
                    <UserIcon />
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="e.g. nimal24"
                      autoComplete="username"
                    />
                  </span>
                </label>

                {role === "student" ? (
                  <label className="signup-field">
                    <span>
                      Age <em>*</em>
                    </span>
                    <span className="signup-control">
                      <CalIcon />
                      <select value={age} onChange={(event) => setAge(event.target.value)}>
                        <option value="">Select your age (12 - 16)</option>
                        {AGES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                ) : (
                  <label className="signup-field">
                    <span>
                      Email <em>*</em>
                    </span>
                    <span className="signup-control">
                      <MailIcon />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Work or family email"
                        autoComplete="email"
                      />
                    </span>
                  </label>
                )}

                <label className="signup-field">
                  <span>Preferred language</span>
                  <span className="signup-control">
                    <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                      {LANGUAGES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>

                {role === "student" ? (
                  <label className="signup-field">
                    <span>Teacher class code (optional)</span>
                    <span className="signup-control">
                      <input
                        value={classCode}
                        onChange={(event) => setClassCode(event.target.value.toUpperCase())}
                        placeholder="If your teacher gave you a code"
                      />
                    </span>
                  </label>
                ) : null}

                {role === "teacher" ? (
                  <label className="signup-field">
                    <span>School or institution (optional)</span>
                    <span className="signup-control">
                      <input
                        value={institution}
                        onChange={(event) => setInstitution(event.target.value)}
                        placeholder="School name"
                      />
                    </span>
                  </label>
                ) : null}

                <label className="signup-field">
                  <span>
                    Password <em>*</em>
                  </span>
                  <span className="signup-control">
                    <LockIcon />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="signup-eye"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((open) => !open)}
                    >
                      👁
                    </button>
                  </span>
                </label>

                <label className="signup-field">
                  <span>
                    Confirm Password <em>*</em>
                  </span>
                  <span className="signup-control">
                    <LockIcon />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="signup-eye"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirm((open) => !open)}
                    >
                      👁
                    </button>
                  </span>
                </label>
              </div>

              <label className="signup-check">
                <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
                <span>
                  I agree to the <button type="button">Terms of Service</button> and{" "}
                  <button type="button">Privacy Policy</button>.
                </span>
              </label>

              {error ? <p className="signup-error">{error}</p> : null}
              {suggestions.length ? (
                <p className="signup-suggestions">
                  {suggestions.map((item) => (
                    <button key={item} type="button" onClick={() => setUsername(item)}>
                      {item}
                    </button>
                  ))}
                </p>
              ) : null}

              <div className="signup-actions">
                <button className="signup-back" type="button" onClick={() => setStep("role")}>
                  Back
                </button>
                <button className="signup-next" type="submit">
                  {role === "student" ? "Next →" : "Create account"}
                </button>
              </div>
              <p className="signup-login">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </form>
          ) : null}

          {step === "avatar" ? (
            <div className="signup-form">
              <h2>Choose Avatar</h2>
              <p className="signup-sub">This picture follows you on every student page.</p>
              <div className="signup-avatars">
                {PRACTICE_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    className={`signup-avatar${avatarId === avatar.id ? " is-on" : ""}`}
                    style={{ "--tone": avatar.tone } as CSSProperties}
                    onClick={() => setAvatarId(avatar.id)}
                  >
                    <img src={avatar.src} alt="" />
                    <span>{avatar.label}</span>
                  </button>
                ))}
              </div>
              {error ? <p className="signup-error">{error}</p> : null}
              <div className="signup-actions">
                <button className="signup-back" type="button" onClick={() => setStep("details")}>
                  Back
                </button>
                <button className="signup-next" type="button" onClick={completeStudent}>
                  Next →
                </button>
              </div>
            </div>
          ) : null}

          {step === "done" && role ? (
            <div className="signup-form signup-done">
              <h2>All Set!</h2>
              <p className="signup-sub">
                Welcome, {name.trim() || "friend"} (@{username}). This is a practice {role} account. No
                real money or banks. Your password is stored as a hash, not as plain text.
              </p>
              {role === "student" ? <ChildAvatar className="signup-picked" avatarId={avatarId} name={name} /> : null}
              <button className="signup-next" type="button" onClick={() => navigate(homePathForRole(role))}>
                Go to my dashboard
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="signup-ico" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19c1.2-3.2 3.4-5 7-5s5.8 1.8 7 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="signup-ico" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 8l7 5 7-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="signup-ico" aria-hidden="true">
      <rect x="4" y="6" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 4v4M16 4v4M4 10h16" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="signup-ico" aria-hidden="true">
      <rect x="6" y="11" width="12" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
