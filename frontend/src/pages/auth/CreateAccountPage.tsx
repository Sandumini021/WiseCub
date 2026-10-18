import { useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CubMascot } from "../../components/cub-assistant/CubMascot";
import { ChildAvatar } from "./ChildAvatar";
import { PRACTICE_AVATARS } from "./avatars";
import { writeSignupProfile } from "./demoSession";
import "../../styles/signup.css";

const AGES = ["12", "13", "14", "15", "16"];

type Step = 1 | 2 | 3;

export function CreateAccountPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [student, setStudent] = useState(true);
  const [avatarId, setAvatarId] = useState<(typeof PRACTICE_AVATARS)[number]["id"]>("kid-sky");
  const [error, setError] = useState<string | null>(null);

  function onDetails(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter an email address.");
      return;
    }
    if (!age) {
      setError("Please select your age (12–16).");
      return;
    }
    if (password.length < 4) {
      setError("Choose a practice password (at least 4 characters).");
      return;
    }
    if (password !== confirm) {
      setError("Password and confirm password must match.");
      return;
    }
    if (!terms) {
      setError("Please agree to the Terms of Service to continue.");
      return;
    }
    setError(null);
    setPassword("");
    setConfirm("");
    setStep(2);
  }

  function finishSignup() {
    writeSignupProfile({
      name,
      email,
      age,
      gender,
      avatarId,
    });
    setStep(3);
  }

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
          <p className="signup-hero-lead">Let&apos;s get started on your financial learning journey!</p>
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
          <ol className="signup-steps" aria-label="Account setup steps">
            <li className={step === 1 ? "is-current" : "is-done"}>
              <span>1</span>
              Account Details
            </li>
            <li className={step === 2 ? "is-current" : step > 2 ? "is-done" : ""}>
              <span>2</span>
              Choose Avatar
            </li>
            <li className={step === 3 ? "is-current" : ""}>
              <span>3</span>
              All Set!
            </li>
          </ol>

          {step === 1 ? (
            <form className="signup-form" onSubmit={onDetails}>
              <h2>Account Details</h2>
              <p className="signup-sub">Tell us a little about yourself</p>

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
                    Email Address <em>*</em>
                  </span>
                  <span className="signup-control">
                    <MailIcon />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email address"
                      autoComplete="email"
                    />
                  </span>
                </label>

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

                <fieldset className="signup-field">
                  <legend>
                    Gender <em>*</em>
                  </legend>
                  <div className="signup-genders">
                    {["Male", "Female", "Other"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={gender === option ? "is-on" : ""}
                        onClick={() => setGender(option)}
                      >
                        {option === "Male" ? "♂" : option === "Female" ? "♀" : "☺"} {option}
                      </button>
                    ))}
                  </div>
                </fieldset>

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
              <label className="signup-check">
                <input type="checkbox" checked={student} onChange={(event) => setStudent(event.target.checked)} />
                <span>I&apos;m a student and I&apos;m joining for educational purposes.</span>
              </label>

              {error ? <p className="signup-error">{error}</p> : null}

              <button className="signup-next" type="submit">
                Next →
              </button>
              <p className="signup-login">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </form>
          ) : null}

          {step === 2 ? (
            <div className="signup-form">
              <h2>Choose Avatar</h2>
              <p className="signup-sub">Pick a practice look for your profile</p>
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
              <div className="signup-actions">
                <button className="signup-back" type="button" onClick={() => setStep(1)}>
                  Back
                </button>
                <button className="signup-next" type="button" onClick={finishSignup}>
                  Next →
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="signup-form signup-done">
              <h2>All Set!</h2>
              <p className="signup-sub">
                Welcome, {name.trim() || "friend"}. This is a practice account. No real money, banks, or
                passwords are stored.
              </p>
              <ChildAvatar className="signup-picked" avatarId={avatarId} name={name} />
              <button className="signup-next" type="button" onClick={() => navigate("/home")}>
                Go to playground
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

