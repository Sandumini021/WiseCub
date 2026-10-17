import { Link } from "react-router-dom";
import { CubMascot } from "../../components/cub-assistant/CubMascot";
import { readDemoChild } from "../auth/demoSession";
import "../../styles/home-login.css";

const worlds = [
  {
    to: "/missions",
    title: "Money Missions",
    blurb: "Learn by doing, not by reading.",
    ready: false,
  },
  {
    to: "/market",
    title: "Market Floor",
    blurb: "A real market. Fake money. No regrets.",
    ready: true,
  },
  {
    to: "/safety",
    title: "Scam Alley",
    blurb: "We send the scam, so no one else has to.",
    ready: false,
  },
  {
    to: "/choices",
    title: "Choice Town",
    blurb: "Every choice shows its future.",
    ready: false,
  },
] as const;

export function DashboardPage() {
  const child = readDemoChild();
  const hello = child?.name ? `Hi ${child.name}.` : "Hi.";

  return (
    <div className="home-dash">
      <p className="muted">Demo · virtual money only · ages 12–16</p>
      <h1>Pick a world. Cub comes with you.</h1>
      <p>
        {hello} Four rooms to practise money skills. The Market Floor is open
        first. The others stay as maps until their owners build them.
      </p>

      <div className="world-map">
        {worlds.map((world) => (
          <Link
            key={world.to}
            className={`world-card${world.ready ? " is-ready" : ""}`}
            to={world.to}
          >
            <strong>
              {world.title}
              <span>{world.ready ? "Open" : "Coming next"}</span>
            </strong>
            <p>{world.blurb}</p>
          </Link>
        ))}
        <div className="world-cub">
          <CubMascot size={72} />
          <span>Cub</span>
        </div>
      </div>

      <p className="ask-strip">Tap Ask Cub and speak — English first. Sinhala comes later.</p>

      <section className="home-learn">
        <h2>What you are actually learning</h2>
        <ul>
          <li>Patience and spreading money on the practice market</li>
          <li>Spotting fake messages inside WiseCub only</li>
          <li>How a choice today can change later</li>
        </ul>
      </section>

      <section className="grown-strip">
        <div>
          <p className="muted">Grown-ups</p>
          <p>Parents see understanding, not screen time. Habit notes — never a profit rank.</p>
        </div>
        <Link className="btn-ghost" to="/progress">
          Track progress
        </Link>
      </section>
    </div>
  );
}
