import { useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CubMascot } from "../../components/cub-assistant/CubMascot";
import { ApiError, checkUsername } from "../../services/apiClient";
import { ChildAvatar } from "./ChildAvatar";
import { PRACTICE_AVATARS } from "./avatars";
import { readCubLanguage, writeCubLanguage, writeSignupProfile } from "./demoSession";
import { LanguageSelect } from "../../components/layout/LanguageSelect";
import { useLang } from "../../i18n/useLang";
import { LANGUAGES, normalizeUsername, type AccountRole, homePathForRole } from "./roles";
import "../../styles/signup.css";

const AGES = ["12", "13", "14", "15", "16"];
type Step = "role" | "details" | "avatar" | "done";

const ROLES: AccountRole[] = ["student", "teacher", "guardian"];

export function CreateAccountPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<AccountRole | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [language, setLanguage] = useState(() => readCubLanguage());
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
      setError(t("signup.needPass"));
      return false;
    }
    if (password !== confirm) {
      setError(t("signup.passMatch"));
      return false;
    }
    if (!terms) {
      setError(t("signup.needTerms"));
      return false;
    }
    return true;
  }

  async function onDetails(event: FormEvent) {
    event.preventDefault();
    if (!role) {
      setError(t("signup.pickRole"));
      return;
    }
    if (!name.trim()) {
      setError(t("signup.needName"));
      return;
    }
    const user = normalizeUsername(username);
    if (user.length < 3) {
      setError(t("signup.needUser"));
      return;
    }
    if (role === "student" && !age) {
      setError(t("signup.needAge"));
      return;
    }
    if (role !== "student" && (!email.trim() || !email.includes("@"))) {
      setError(t("signup.needEmail"));
      return;
    }
    if (!commonPasswordOk()) {
      return;
    }
    try {
      const check = await checkUsername(user);
      if (check.taken) {
        setSuggestions(check.suggestions);
        setError(t("signup.userTaken"));
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
      setError(t("signup.createFail"));
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
      <div className="signup-lang">
        <LanguageSelect />
      </div>
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
          <h1>{t("signup.title")}</h1>
          <p className="signup-hero-lead">{t("signup.lead")}</p>
          <div className="signup-cub-stage">
            <span className="signup-float signup-bulb">💡</span>
            <span className="signup-float signup-chart">📈</span>
            <span className="signup-float signup-plane">✈️</span>
            <CubMascot size={210} />
            <div className="signup-books">
              <span className="signup-book is-green">{t("signup.learn")}</span>
              <span className="signup-book is-gold">{t("signup.invest")}</span>
              <span className="signup-book is-blue">{t("signup.save")}</span>
              <span className="signup-book is-purple">{t("signup.staySafe")}</span>
            </div>
          </div>
          <blockquote>
            “{t("signup.quote")}”
            <cite>— WiseCub</cite>
          </blockquote>
        </aside>

        <section className="signup-pane" id="main">
          <p className="signup-demo-flag">{t("signup.practice")}</p>
          <ol className="signup-steps" aria-label={t("signup.title")}>
            <li className={stepIndex === 0 ? "is-current" : "is-done"}>
              <span>1</span>
              {t("signup.stepRole")}
            </li>
            <li className={stepIndex === 1 ? "is-current" : stepIndex > 1 ? "is-done" : ""}>
              <span>2</span>
              {t("signup.stepDetails")}
            </li>
            <li className={stepIndex === 2 ? "is-current" : stepIndex > 2 ? "is-done" : ""}>
              <span>3</span>
              {role === "student" ? t("signup.stepAvatar") : t("signup.stepDone")}
            </li>
          </ol>

          {step === "role" ? (
            <div className="signup-form">
              <h2>{t("signup.who")}</h2>
              <p className="signup-sub">{t("signup.whoHint")}</p>
              <div className="signup-roles">
                {ROLES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`signup-role${role === id ? " is-on" : ""}`}
                    onClick={() => setRole(id)}
                  >
                    <strong>{t(`signup.${id}`)}</strong>
                    <span>{t(`signup.${id}Blurb`)}</span>
                  </button>
                ))}
              </div>
              {error ? <p className="signup-error">{error}</p> : null}
              <button
                className="signup-next"
                type="button"
                onClick={() => {
                  if (!role) {
                    setError(t("signup.pickRole"));
                    return;
                  }
                  setError(null);
                  setStep("details");
                }}
              >
                {t("signup.next")}
              </button>
              <p className="signup-login">
                {t("signup.haveAccount")} <Link to="/login">{t("common.login")}</Link>
              </p>
            </div>
          ) : null}

          {step === "details" ? (
            <form className="signup-form" onSubmit={(event) => void onDetails(event)}>
              <h2>
                {role === "teacher"
                  ? t("signup.teacherDetails")
                  : role === "guardian"
                    ? t("signup.guardianDetails")
                    : t("signup.studentDetails")}
              </h2>
              <p className="signup-sub">
                {role === "student" ? t("signup.studentHint") : t("signup.adultHint")}
              </p>

              <div className="signup-grid">
                <label className="signup-field">
                  <span>
                    {t("signup.fullName")} <em>*</em>
                  </span>
                  <span className="signup-control">
                    <UserIcon />
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t("signup.namePh")}
                      autoComplete="name"
                    />
                  </span>
                </label>

                <label className="signup-field">
                  <span>
                    {t("signup.username")} <em>*</em>
                  </span>
                  <span className="signup-control">
                    <UserIcon />
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder={t("signup.userPh")}
                      autoComplete="username"
                    />
                  </span>
                </label>

                {role === "student" ? (
                  <label className="signup-field">
                    <span>
                      {t("signup.age")} <em>*</em>
                    </span>
                    <span className="signup-control">
                      <CalIcon />
                      <select value={age} onChange={(event) => setAge(event.target.value)}>
                        <option value="">{t("signup.agePick")}</option>
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
                      {t("signup.email")} <em>*</em>
                    </span>
                    <span className="signup-control">
                      <MailIcon />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t("signup.emailPh")}
                        autoComplete="email"
                      />
                    </span>
                  </label>
                )}

                <label className="signup-field">
                  <span>{t("signup.preferred")}</span>
                  <span className="signup-control">
                    <select
                      value={language}
                      onChange={(event) => {
                        const next = event.target.value;
                        setLanguage(next);
                        if (next === "en" || next === "si" || next === "sg") {
                          writeCubLanguage(next);
                        }
                      }}
                    >
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
                    <span>{t("signup.classCode")}</span>
                    <span className="signup-control">
                      <input
                        value={classCode}
                        onChange={(event) => setClassCode(event.target.value.toUpperCase())}
                        placeholder={t("signup.classPh")}
                      />
                    </span>
                  </label>
                ) : null}

                {role === "teacher" ? (
                  <label className="signup-field">
                    <span>{t("signup.school")}</span>
                    <span className="signup-control">
                      <input
                        value={institution}
                        onChange={(event) => setInstitution(event.target.value)}
                        placeholder={t("signup.schoolPh")}
                      />
                    </span>
                  </label>
                ) : null}

                <label className="signup-field">
                  <span>
                    {t("signup.password")} <em>*</em>
                  </span>
                  <span className="signup-control">
                    <LockIcon />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={t("signup.passwordPh")}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="signup-eye"
                      aria-label={showPassword ? t("login.hide") : t("login.show")}
                      onClick={() => setShowPassword((open) => !open)}
                    >
                      👁
                    </button>
                  </span>
                </label>

                <label className="signup-field">
                  <span>
                    {t("signup.confirm")} <em>*</em>
                  </span>
                  <span className="signup-control">
                    <LockIcon />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      placeholder={t("signup.confirmPh")}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="signup-eye"
                      aria-label={showConfirm ? t("login.hide") : t("login.show")}
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
                  {t("signup.terms")}
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
                  {t("common.back")}
                </button>
                <button className="signup-next" type="submit">
                  {role === "student" ? t("signup.next") : t("signup.create")}
                </button>
              </div>
              <p className="signup-login">
                {t("signup.haveAccount")} <Link to="/login">{t("common.login")}</Link>
              </p>
            </form>
          ) : null}

          {step === "avatar" ? (
            <div className="signup-form">
              <h2>{t("signup.chooseAvatar")}</h2>
              <p className="signup-sub">{t("signup.avatarHint")}</p>
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
                  {t("common.back")}
                </button>
                <button className="signup-next" type="button" onClick={completeStudent}>
                  {t("signup.next")}
                </button>
              </div>
            </div>
          ) : null}

          {step === "done" && role ? (
            <div className="signup-form signup-done">
              <h2>{t("signup.allSet")}</h2>
              <p className="signup-sub">
                {t("signup.welcomeDone", {
                  name: name.trim() || t("common.guest"),
                  user: username,
                  role,
                })}
              </p>
              {role === "student" ? <ChildAvatar className="signup-picked" avatarId={avatarId} name={name} /> : null}
              <button className="signup-next" type="button" onClick={() => navigate(homePathForRole(role))}>
                {t("signup.goDash")}
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
