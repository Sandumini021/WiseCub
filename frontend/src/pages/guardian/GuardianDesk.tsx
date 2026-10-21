import { useState } from "react";
import { RequireRole } from "../../components/auth/RequireRole";
import { RoleShell } from "../../components/layout/RoleShell";
import { useDemoChild } from "../auth/demoSession";
import { inviteNote, readGuardianDesk, saveGuardianDesk } from "./guardianPreview";
import "../../styles/role-workbench.css";

const LINKS = [
  { to: "/guardian/dashboard", label: "Home" },
  { to: "/guardian/children", label: "Children" },
  { to: "/guardian/progress", label: "Progress" },
  { to: "/guardian/quizzes", label: "Quizzes" },
  { to: "/guardian/tips", label: "Tips" },
];

type View = "home" | "children" | "progress" | "quizzes" | "tips";

function firstName(full?: string) {
  return full?.trim().split(/\s+/)[0] || "there";
}

export function GuardianDesk({ view }: { view: View }) {
  const { child } = useDemoChild();
  const [desk, setDesk] = useState(readGuardianDesk);
  const [picked, setPicked] = useState(desk.children[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("Paste a code from the child or teacher. Searching by username is blocked.");
  const kid = desk.children.find((row) => row.id === picked) ?? desk.children[0];

  function tryLink() {
    const trimmed = code.trim().toUpperCase();
    const status = inviteNote(code);
    if (status !== "ok") {
      setNote(status);
      return;
    }
    if (trimmed === "WC-J26" && !desk.children.some((row) => row.id === "g-demo")) {
      const next = {
        children: [
          ...desk.children,
          {
            id: "g-demo",
            name: "Linked preview",
            age: "14",
            missions: 20,
            market: 15,
            safety: 40,
            choices: 10,
            note: "Invite accepted on this device only. Not a live school record.",
          },
        ],
      };
      setDesk(next);
      saveGuardianDesk(next);
      setPicked("g-demo");
      setNote("Preview link added. Real invites will land here later.");
      setCode("");
      return;
    }
    setNote("That code is not on this preview desk. Try WC-J26 to see how a link looks.");
  }

  return (
    <RequireRole role="guardian">
    <RoleShell title="Parent desk" banner="Parent preview. You only see a child after an invite — never by guessing a username." links={LINKS}>
      <section className="rb-hero is-parent">
        <div>
          <p>Parent desk</p>
          <h1>Hi, {firstName(child?.name)}</h1>
          <p>See habits and modules. No profit ranks, no other families.</p>
        </div>
        <div className="rb-stats">
          <button className="rb-stat" type="button">
            <b>{desk.children.length}</b>
            <span>Linked</span>
          </button>
          <button className="rb-stat" type="button">
            <b>{kid?.safety ?? 0}%</b>
            <span>Safety</span>
          </button>
          <button className="rb-stat" type="button">
            <b>{kid?.market ?? 0}%</b>
            <span>Market</span>
          </button>
          <button className="rb-stat" type="button">
            <b>Off</b>
            <span>Live ranks</span>
          </button>
        </div>
      </section>

      {view === "tips" ? (
        <article className="rb-card">
          <h2>Talk tips</h2>
          <ul className="rb-feed">
            <li>
              <span>Ask what they waited for, not what they “won”.</span>
              <span>Habit</span>
            </li>
            <li>
              <span>Practice cash is pretend. Keep real money off this app.</span>
              <span>Safety</span>
            </li>
            <li>
              <span>Scam drills stay in-app. Cub never asks for a password.</span>
              <span>Cub</span>
            </li>
          </ul>
        </article>
      ) : null}

      {view === "quizzes" ? (
        <article className="rb-card">
          <h2>{kid?.name ?? "Child"} · recent practice</h2>
          <ul className="rb-feed">
            <li>
              <span>Money basics</span>
              <span>Done</span>
            </li>
            <li>
              <span>Spot the scam</span>
              <span>In progress</span>
            </li>
            <li>
              <span>Wait after a drop</span>
              <span>Opened</span>
            </li>
          </ul>
        </article>
      ) : null}

      {view === "home" || view === "children" || view === "progress" ? (
        <div className="rb-grid">
          <article className="rb-card">
            <h2>Linked children</h2>
            <ul className="rb-list">
              {desk.children.map((row) => (
                <li key={row.id}>
                  <button className={row.id === kid?.id ? "is-on" : ""} type="button" onClick={() => setPicked(row.id)}>
                    <span>
                      <strong>{row.name}</strong>
                      <br />
                      Age {row.age}
                    </span>
                    <span>Preview</span>
                  </button>
                </li>
              ))}
            </ul>
            {view === "children" ? (
              <div className="rb-form">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Invite code" />
                <button className="btn-primary" type="button" onClick={tryLink}>
                  Use invite
                </button>
                <p>{note}</p>
              </div>
            ) : null}
          </article>
          <article className="rb-card">
            {kid ? (
              <>
                <h2>{kid.name}</h2>
                <p>{kid.note}</p>
                <div className="rb-bars" style={{ marginTop: "0.8rem" }}>
                  {[
                    { label: "Missions", n: kid.missions },
                    { label: "Market practice", n: kid.market },
                    { label: "Scam safety", n: kid.safety },
                    { label: "Life choices", n: kid.choices },
                  ].map((row) => (
                    <div key={row.label}>
                      <p>
                        <span>{row.label}</span>
                        <span>{row.n}%</span>
                      </p>
                      <div className="rb-track">
                        <i style={{ width: `${row.n}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rb-empty">No child linked yet</div>
            )}
          </article>
        </div>
      ) : null}
    </RoleShell>
    </RequireRole>
  );
}
