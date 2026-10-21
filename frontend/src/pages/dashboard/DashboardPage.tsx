import { Link, Navigate } from "react-router-dom";
import { SiteTopBar } from "../../components/layout/SiteTopBar";
import { useLang } from "../../i18n/useLang";
import { readLesson1Complete } from "../../modules/stock-market/data/demoMarket";
import { readBook } from "../../modules/stock-market/data/demoPortfolio";
import { ChildAvatar } from "../auth/ChildAvatar";
import { useDemoChild } from "../auth/demoSession";
import { homePathForRole } from "../auth/roles";
import "../../styles/dashboard-long.css";

const WORLDS = [
  { to: "/missions", id: "missions", icon: "🎯", tone: "green" },
  { to: "/market", id: "market", icon: "📈", tone: "gold" },
  { to: "/safety", id: "safety", icon: "🛡️", tone: "coral" },
  { to: "/choices", id: "choices", icon: "🧭", tone: "teal" },
  { to: "/tax", id: "tax", icon: "🧾", tone: "navy" },
] as const;

function firstName(full?: string) {
  const trimmed = full?.trim();
  if (!trimmed) {
    return "friend";
  }
  const first = trimmed.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function DashboardPage() {
  const { lang, t } = useLang();
  const { child } = useDemoChild();
  if (child?.role === "teacher" || child?.role === "guardian") {
    return <Navigate to={homePathForRole(child.role)} replace />;
  }
  const name = firstName(child?.name);
  const book = readBook();
  const lessonDone = readLesson1Complete();
  const progressPct = lessonDone ? 25 : 8;
  const level = lessonDone ? 2 : 1;

  return (
    <div className="dash-long" id="main">
      <SiteTopBar />

      <section className="dash-hero-long">
        <div className="dash-hero-copy">
          <h1>{t("dash.hi", { name })}</h1>
          <p className="dash-ready">{t("dash.ready")}</p>
          <blockquote>
            “{t("dash.quote")}”
            <cite>— WiseCub</cite>
          </blockquote>
          {!child ? (
            <p className="dash-login-hint">
              <Link to="/login">{t("dash.loginLink")}</Link> {t("dash.loginHint")}{" "}
              <Link to="/signup">{t("dash.createLink")}</Link>
            </p>
          ) : null}
        </div>
        <div className="dash-hero-side">
          <aside className="dash-progress-card">
            <p>{t("dash.progress")}</p>
            <strong>
              {t("dash.level", { level })} <span>{progressPct}%</span>
            </strong>
            <div className="dash-bar">
              <i style={{ width: `${progressPct}%` }} />
            </div>
            <ul>
              <li>
                <b>{lessonDone ? 1 : 0}</b>
                {t("dash.lessons")}
              </li>
              <li>
                <b>{book.trades.length}</b>
                {t("dash.trades")}
              </li>
              <li>
                <b>1</b>
                {t("dash.day")}
              </li>
            </ul>
          </aside>
          {child?.avatarId ? (
            <ChildAvatar className="dash-hero-cub" avatarId={child.avatarId} name={child.name} alt="" />
          ) : (
            <img className="dash-hero-cub" src="/images/dash/cub-hero.png" alt={t("dash.cubAlt")} />
          )}
        </div>
      </section>

      <section className="dash-block">
        <h2>{t("dash.quizzesH")}</h2>
        <p className="muted">{t("dash.quizzesB")}</p>
      </section>

      <section className="dash-block">
        <h2>{t("dash.explore")}</h2>
        <div className="dash-worlds">
          {WORLDS.map((world) => (
            <Link key={world.to} className={`dash-world tone-${world.tone}`} to={world.to}>
              <span className="dash-world-ico" aria-hidden="true">
                {world.icon}
              </span>
              <p className="dash-kicker">{t(`dash.worlds.${world.id}K`)}</p>
              <strong>{t(`dash.worlds.${world.id}T`)}</strong>
              <p>{t(`dash.worlds.${world.id}B`)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="dash-learn-band">
        <div>
          <p className="dash-kicker">{t("dash.bands.learnK")}</p>
          <h2>{t("dash.bands.learnH")}</h2>
          <p>{t("dash.bands.learnB")}</p>
          <Link className="dash-cta is-gold" to="/missions">
            {t("dash.bands.learnCta")}
          </Link>
        </div>
        <div className="dash-learn-art">
          <img className="dash-scene" src="/images/dash/learn-by-doing.jpg" alt={t("dash.learnAlt")} />
        </div>
      </section>

      <section className="dash-market-band">
        <div className="dash-learn-art">
          <img className="dash-scene" src="/images/dash/real-market.jpg" alt={t("dash.marketAlt")} />
        </div>
        <div>
          <p className="dash-kicker">{t("dash.bands.marketK")}</p>
          <h2>{t("dash.bands.marketH")}</h2>
          <p>{t("dash.bands.marketB")}</p>
          <Link className="dash-cta is-blue" to="/market">
            {t("dash.bands.marketCta")}
          </Link>
        </div>
      </section>

      <section className="dash-safe-band">
        <div>
          <p className="dash-kicker">{t("dash.bands.safeK")}</p>
          <h2>{t("dash.bands.safeH")}</h2>
          <p>{t("dash.bands.safeB")}</p>
          <Link className="dash-cta is-coral" to="/safety">
            {t("dash.bands.safeCta")}
          </Link>
        </div>
        <div className="dash-scam-preview">
          <div>
            <p>{t("dash.bands.preview")}</p>
            <div className="dash-sms">
              <strong>{t("dash.bands.unknown")}</strong>
              <span>{t("dash.bands.sms")}</span>
            </div>
          </div>
          <img className="dash-portrait" src="/images/dash/cub-detective.png" alt={t("dash.scamAlt")} />
        </div>
      </section>

      <section className="dash-choice-band">
        <div className="dash-learn-art">
          <img className="dash-scene" src="/images/dash/life-choices.jpg" alt={t("dash.choiceAlt")} />
        </div>
        <div>
          <p className="dash-kicker">{t("dash.bands.choiceK")}</p>
          <h2>{t("dash.bands.choiceH")}</h2>
          <p>{t("dash.bands.choiceB")}</p>
          <Link className="dash-cta is-navy" to="/choices">
            {t("dash.bands.choiceCta")}
          </Link>
        </div>
      </section>

      <section className="dash-buddy-band">
        <div>
          <p className="dash-kicker">{t("dash.bands.buddyK")}</p>
          <h2>{t("dash.bands.buddyH")}</h2>
          <p>{t("dash.bands.buddyB")}</p>
          <p className="dash-langs">
            <span className={lang === "si" ? "is-on" : undefined}>සිංහල</span>
            <span className={lang === "sg" ? "is-on" : undefined}>Singlish</span>
            <span className={lang === "en" ? "is-on" : undefined}>English</span>
          </p>
        </div>
        <div className="dash-buddy-card">
          <img className="dash-portrait" src="/images/dash/cub-explain.png" alt={t("dash.explainAlt")} />
          <div>
            <p>{t("dash.bands.buddyHi")}</p>
            <p className="muted">{t("dash.bands.buddyNote")}</p>
          </div>
        </div>
      </section>

      <section className="dash-parent-band">
        <div>
          <p className="dash-kicker">{t("dash.bands.parentK")}</p>
          <h2>{t("dash.bands.parentH")}</h2>
          <p>{t("dash.bands.parentB")}</p>
          <Link className="dash-cta is-purple" to="/progress">
            {t("dash.bands.parentCta")}
          </Link>
        </div>
        <div className="dash-parent-card">
          <ChildAvatar className="dash-parent-face" avatarId={child?.avatarId} name={child?.name} />
          <p>
            {child?.name?.trim() || t("dash.bands.demoChild")}
            {child?.age ? ` · ${t("profile.age")} ${child.age}` : ""}
          </p>
          <ul>
            <li>
              {t("dash.bands.missionsReady")} <b>—</b>
            </li>
            <li>
              {t("dash.bands.practiceTrades")} <b>{book.trades.length}</b>
            </li>
            <li>
              {t("dash.bands.lesson1")} <b>{lessonDone ? t("dash.bands.done") : t("dash.bands.open")}</b>
            </li>
          </ul>
        </div>
      </section>

      <footer className="dash-foot">
        <img className="dash-foot-bg" src="/images/dash/bg-footer.png" alt="" />
        <div className="dash-foot-copy">
          <h2>{t("dash.bands.footH")}</h2>
          <Link className="dash-cta is-gold" to="/missions">
            {t("dash.bands.keep")}
          </Link>
          <p>{t("dash.bands.footP")}</p>
        </div>
        <img className="dash-foot-cubs" src="/images/dash/cub-thumbs.png" alt="" />
      </footer>
    </div>
  );
}
