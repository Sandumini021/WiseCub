import { Link } from "react-router-dom";
import { SiteTopBar } from "../../components/layout/SiteTopBar";
import { readLesson1Complete } from "../../modules/stock-market/data/demoMarket";
import { readBook } from "../../modules/stock-market/data/demoPortfolio";
import { buildQuotes } from "../../modules/stock-market/data/syntheticPrices";
import { useDemoChild } from "../auth/demoSession";
import "../../styles/dashboard-long.css";

const WORLDS = [
  {
    to: "/missions",
    kicker: "Learn",
    title: "Money Missions",
    blurb: "Learn through fun quizzes and challenges.",
    icon: "🎯",
    tone: "green",
  },
  {
    to: "/market",
    kicker: "Market",
    title: "Virtual Stock Market",
    blurb: "Practice investing with virtual money.",
    icon: "📈",
    tone: "gold",
  },
  {
    to: "/safety",
    kicker: "Stay Safe",
    title: "Scam Safety",
    blurb: "Learn to spot and avoid scams.",
    icon: "🛡️",
    tone: "coral",
  },
  {
    to: "/choices",
    kicker: "Life Choices",
    title: "Life Choices",
    blurb: "See how your choices shape the future.",
    icon: "🧭",
    tone: "teal",
  },
] as const;

function firstName(full?: string) {
  const trimmed = full?.trim();
  if (!trimmed) {
    return "friend";
  }
  const first = trimmed.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function rupees(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-LK")}`;
}

export function DashboardPage() {
  const child = useDemoChild();
  const name = firstName(child?.name);
  const book = readBook();
  const quotes = buildQuotes().slice(0, 3);
  const lessonDone = readLesson1Complete();
  const progressPct = lessonDone ? 25 : 8;
  const level = lessonDone ? 2 : 1;

  return (
    <div className="dash-long" id="main">
      <SiteTopBar />

      <section className="dash-hero-long">
        <div className="dash-hero-copy">
          <h1>Hi, {name}!</h1>
          <p className="dash-ready">Ready to grow your money skills today?</p>
          <blockquote>
            “Small steps today, bigger dreams tomorrow!”
            <cite>— WiseCub</cite>
          </blockquote>
          {!child ? (
            <p className="dash-login-hint">
              <Link to="/login">Login</Link> or <Link to="/signup">create an account</Link> so this
              greeting uses your name.
            </p>
          ) : null}
        </div>
        <div className="dash-hero-side">
          <aside className="dash-progress-card">
            <p>Your Progress</p>
            <strong>
              Level {level} <span>{progressPct}%</span>
            </strong>
            <div className="dash-bar">
              <i style={{ width: `${progressPct}%` }} />
            </div>
            <ul>
              <li>
                <b>{lessonDone ? 1 : 0}</b>
                Lessons
              </li>
              <li>
                <b>{book.trades.length}</b>
                Trades
              </li>
              <li>
                <b>1</b>
                Day here
              </li>
            </ul>
          </aside>
          <img className="dash-hero-cub" src="/images/dash/cub-hero.png" alt="Cub waving" />
        </div>
      </section>

      <section className="dash-block">
        <h2>Explore WiseCub</h2>
        <div className="dash-worlds">
          {WORLDS.map((world) => (
            <Link key={world.to} className={`dash-world tone-${world.tone}`} to={world.to}>
              <span className="dash-world-ico" aria-hidden="true">
                {world.icon}
              </span>
              <p className="dash-kicker">{world.kicker}</p>
              <strong>{world.title}</strong>
              <p>{world.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="dash-learn-band">
        <div>
          <p className="dash-kicker">Learn</p>
          <h2>Learn by doing, not by reading.</h2>
          <p>
            Complete fun missions, interactive lessons and real life scenarios to build money skills
            step by step. Missions stay inside WiseCub — virtual coins only.
          </p>
          <Link className="dash-cta is-gold" to="/missions">
            Go to Missions
          </Link>
        </div>
        <div className="dash-learn-art">
          <img className="dash-scene" src="/images/dash/bg-learn-room.png" alt="" />
          <img className="dash-portrait" src="/images/dash/child-luna.png" alt="" />
          <div className="dash-chip-float">Budgeting basics</div>
          <div className="dash-chip-float is-2">Needs vs Wants</div>
          <div className="dash-chip-float is-3">Saving goals</div>
        </div>
      </section>

      <section className="dash-market-band">
        <div className="dash-folio">
          <img className="dash-chart-bg" src="/images/dash/bg-market-chart.png" alt="" />
          <p className="dash-kicker">My Portfolio</p>
          <p className="dash-cash">{rupees(book.cash)}</p>
          <p className="muted">Practice cash · not real money</p>
          <ul className="dash-quotes">
            {quotes.map((quote) => (
              <li key={quote.ticker}>
                <span>{quote.ticker}</span>
                <b>{rupees(quote.price)}</b>
                <em className={quote.changePct >= 0 ? "up" : "down"}>
                  {quote.changePct >= 0 ? "+" : ""}
                  {quote.changePct.toFixed(1)}%
                </em>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="dash-kicker">Market</p>
          <h2>A real market. Fake money. No regrets.</h2>
          <p>
            Explore the virtual stock market, practise trades, and build your own portfolio with
            pretend rupees.
          </p>
          <Link className="dash-cta is-blue" to="/market">
            Open Market Simulator
          </Link>
        </div>
      </section>

      <section className="dash-safe-band">
        <div>
          <p className="dash-kicker">Stay Safe</p>
          <h2>We send the scam, so no one else has to.</h2>
          <p>
            Try realistic scam scenarios and learn how to identify and avoid fraud in a safe space.
            WiseCub never sends real messages.
          </p>
          <Link className="dash-cta is-coral" to="/safety">
            Take the 60-second Test
          </Link>
        </div>
        <div className="dash-scam-preview">
          <div>
            <p>Practice preview</p>
            <div className="dash-sms">
              <strong>Unknown Number</strong>
              <span>Congratulations! You have won Rs. 50,000. This is a fake drill.</span>
            </div>
          </div>
          <img className="dash-portrait" src="/images/dash/cub-detective.png" alt="Cub looking for scams" />
        </div>
      </section>

      <section className="dash-choice-band">
        <div className="dash-choice-art">
          <img className="dash-portrait" src="/images/dash/child-sky.png" alt="" />
          <div className="dash-choice-icons" aria-hidden="true">
            <span>🏠</span>
            <span>🚗</span>
            <span>✈️</span>
            <span>🎓</span>
          </div>
        </div>
        <div>
          <p className="dash-kicker">Life Choices</p>
          <h2>Every choice shows its future.</h2>
          <p>
            Explore different life paths and see how your education, spending and saving choices can
            shape your future.
          </p>
          <Link className="dash-cta is-navy" to="/choices">
            Walk a Scenario
          </Link>
        </div>
      </section>

      <section className="dash-buddy-band">
        <div>
          <p className="dash-kicker">Your AI buddy</p>
          <h2>Ask in English first. Sinhala and Tamil come later.</h2>
          <p>
            Chat with Cub on any page. Simple explanations, tips, and guidance — rule-based, not a
            trained model. Pretend money only.
          </p>
          <p className="dash-langs">
            <span>සිංහල</span>
            <span>தமிழ்</span>
            <span className="is-on">English</span>
          </p>
        </div>
        <div className="dash-buddy-card">
          <img className="dash-portrait" src="/images/dash/cub-explain.png" alt="Cub explaining" />
          <div>
            <p>Hey! I&apos;m WiseCub. Ask me anything about money, investing or staying safe.</p>
            <p className="muted">English first. Virtual money only.</p>
          </div>
        </div>
      </section>

      <section className="dash-parent-band">
        <div>
          <p className="dash-kicker">For parents &amp; teachers</p>
          <h2>See progress, not just screen time.</h2>
          <p>
            Track learning progress, completed missions and key skills. Support your child&apos;s
            financial education journey. Habit notes — never a profit rank.
          </p>
          <Link className="dash-cta is-purple" to="/progress">
            View Parent Dashboard
          </Link>
        </div>
        <div className="dash-parent-card">
          <p>
            {child?.name?.trim() || "Demo child"}
            {child?.age ? ` · age ${child.age}` : ""}
          </p>
          <ul>
            <li>
              Missions ready <b>—</b>
            </li>
            <li>
              Practice trades <b>{book.trades.length}</b>
            </li>
            <li>
              Lesson 1 <b>{lessonDone ? "done" : "open"}</b>
            </li>
          </ul>
        </div>
      </section>

      <footer className="dash-foot">
        <img className="dash-foot-bg" src="/images/dash/bg-footer.png" alt="" />
        <div className="dash-foot-copy">
          <h2>A brighter, safer financial future starts with you.</h2>
          <Link className="dash-cta is-gold" to="/missions">
            Keep Learning
          </Link>
          <p>WiseCub · Small steps today, bigger dreams tomorrow.</p>
        </div>
        <img className="dash-foot-cubs" src="/images/dash/cub-thumbs.png" alt="" />
      </footer>
    </div>
  );
}
