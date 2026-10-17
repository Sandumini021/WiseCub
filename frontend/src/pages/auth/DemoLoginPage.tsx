import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CubMascot } from "../../components/cub-assistant/CubMascot";
import { writeDemoChild } from "./demoSession";
import "../../styles/home-login.css";

export function DemoLoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [grownNote, setGrownNote] = useState(false);

  function enter(event: FormEvent) {
    event.preventDefault();
    writeDemoChild(name);
    navigate("/home");
  }

  return (
    <div className="login-shell">
      <header className="login-bar">
        <Link to="/" className="login-brand">
          WiseCub
        </Link>
        <span className="lang-chip">සිං / த / EN</span>
      </header>

      <main id="main" className="login-main">
        <CubMascot size={110} />
        <p className="muted">Ages 12–16 · Sinhala, Tamil and English later · English now</p>
        <h1>Meet Cub. Start free. Nothing real is at risk.</h1>
        <p>
          No password in this demo. Continue as a practice child, then pick a
          world on the dashboard. Cub talks with you on every page.
        </p>

        <form className="login-form" onSubmit={enter}>
          <label htmlFor="child-name">Your name (optional)</label>
          <div className="login-row">
            <input
              id="child-name"
              name="name"
              autoComplete="nickname"
              placeholder="child’s age or first name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button className="btn-gold cub-send" type="submit">
              Get started
            </button>
          </div>
          <p className="micro">Free, no card, no real money at risk. Demo data only.</p>
        </form>

        <div className="grown-strip">
          <div>
            <p className="muted">Parents and teachers</p>
            <p>See what they learned, not just what they clicked.</p>
          </div>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => setGrownNote(true)}
          >
            Grown-up login
          </button>
        </div>
        {grownNote ? (
          <p className="muted">
            Real parent accounts come later. For this demo, continue as the
            child, then open My Progress for habit notes.
          </p>
        ) : null}
      </main>
    </div>
  );
}
