import { useMemo, useState } from "react";
import { RequireRole } from "../../components/auth/RequireRole";
import { RoleShell } from "../../components/layout/RoleShell";
import { useDemoChild } from "../auth/demoSession";
import { makeJoinCode, readTeacherDesk, saveTeacherDesk, type DeskClass } from "./teacherPreview";
import "../../styles/role-workbench.css";

const LINKS = [
  { to: "/teacher/dashboard", label: "Home" },
  { to: "/teacher/classes", label: "Classes" },
  { to: "/teacher/students", label: "Students" },
  { to: "/teacher/quizzes", label: "Quizzes" },
  { to: "/teacher/assignments", label: "Tasks" },
  { to: "/teacher/reports", label: "Reports" },
];

type View = "home" | "classes" | "students" | "quizzes" | "assignments" | "reports";

function firstName(full?: string) {
  return full?.trim().split(/\s+/)[0] || "Teacher";
}

export function TeacherDesk({ view }: { view: View }) {
  const { child } = useDemoChild();
  const [desk, setDesk] = useState(readTeacherDesk);
  const [classId, setClassId] = useState(desk.classes[0]?.id ?? "");
  const [picked, setPicked] = useState(desk.students[0]?.id ?? "");
  const [className, setClassName] = useState("");
  const [copied, setCopied] = useState("");
  const [query, setQuery] = useState("");

  const klass = desk.classes.find((row) => row.id === classId) ?? desk.classes[0];
  const inClass = desk.students.filter((row) => row.classId === (klass?.id ?? ""));
  const filtered = inClass.filter((row) => row.name.toLowerCase().includes(query.toLowerCase()));
  const student = desk.students.find((row) => row.id === picked) ?? inClass[0];

  const stats = useMemo(
    () => [
      { n: desk.classes.length, l: "Classes" },
      { n: desk.students.length, l: "Learners" },
      { n: Math.round(desk.students.reduce((s, r) => s + r.lessons, 0) / Math.max(desk.students.length, 1)), l: "Avg lessons" },
      { n: desk.students.filter((r) => r.wait < 50).length, l: "Need a nudge" },
    ],
    [desk],
  );

  function persist(next: typeof desk) {
    setDesk(next);
    saveTeacherDesk(next);
  }

  function addClass() {
    const name = className.trim() || "New practice class";
    const row: DeskClass = {
      id: `c${Date.now()}`,
      name,
      code: makeJoinCode(),
      students: 0,
    };
    persist({ ...desk, classes: [...desk.classes, row] });
    setClassId(row.id);
    setClassName("");
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
    } catch {
      setCopied("");
    }
  }

  return (
    <RequireRole role="teacher">
    <RoleShell title="Teacher desk" banner="Classroom preview on this device. You cannot open another teacher’s class from here." links={LINKS}>
      <section className="rb-hero">
        <div>
          <p>Teacher desk</p>
          <h1>Hi, {firstName(child?.name)}</h1>
          <p>Watch habits, not profit. This board is a local classroom preview.</p>
        </div>
        <div className="rb-stats">
          {stats.map((item) => (
            <button className="rb-stat" key={item.l} type="button">
              <b>{item.n}</b>
              <span>{item.l}</span>
            </button>
          ))}
        </div>
      </section>

      {view === "classes" ? (
        <div className="rb-grid">
          <article className="rb-card">
            <h2>Make a class</h2>
            <div className="rb-form">
              <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class name" />
              <button className="btn-primary" type="button" onClick={addClass}>
                Add class
              </button>
            </div>
          </article>
          <article className="rb-card">
            <h2>Your classes</h2>
            <ul className="rb-list">
              {desk.classes.map((row) => (
                <li key={row.id}>
                  <button className={row.id === klass?.id ? "is-on" : ""} type="button" onClick={() => setClassId(row.id)}>
                    <span>
                      <strong>{row.name}</strong>
                      <br />
                      {row.students} learners
                    </span>
                    <span className="rb-code">{row.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </div>
      ) : null}

      {view === "quizzes" || view === "assignments" || view === "reports" ? (
        <article className="rb-card">
          <h2>{view === "quizzes" ? "Quiz pack" : view === "assignments" ? "Practice tasks" : "Habit report"}</h2>
          <p>No scores that rank children by virtual money. These rows are a classroom preview.</p>
          <ul className="rb-feed">
            {(view === "reports"
              ? inClass.map((row) => `${row.name} · wait ${row.wait} · spread ${row.spread} · read ${row.read}`)
              : [
                  "Money basics · 8 taps · due Friday",
                  "Spot the scam · class drill · in-app only",
                  "Wait after a drop · habit card",
                ]
            ).map((line) => (
              <li key={line}>
                <span>{line}</span>
                <span>Preview</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {view === "home" || view === "students" ? (
        <div className="rb-grid">
          <article className="rb-card">
            <h2>{klass?.name ?? "Class"}</h2>
            <p className="rb-code">{klass?.code ?? "—"}</p>
            <div className="rb-actions">
              <button className="btn-primary" type="button" onClick={() => klass && copyCode(klass.code)}>
                {copied === klass?.code ? "Copied" : "Copy join code"}
              </button>
            </div>
            {view === "students" ? (
              <div className="rb-form">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a first name" />
              </div>
            ) : null}
            <ul className="rb-list" style={{ marginTop: "0.7rem" }}>
              {filtered.map((row) => (
                <li key={row.id}>
                  <button className={row.id === student?.id ? "is-on" : ""} type="button" onClick={() => setPicked(row.id)}>
                    <span>{row.name}</span>
                    <span>{row.last}</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
          <article className="rb-card">
            {student ? (
              <>
                <h2>{student.name}</h2>
                <div className="rb-pills">
                  <span>{student.lessons} lessons</span>
                  <span>{student.last}</span>
                </div>
                <div className="rb-bars" style={{ marginTop: "0.8rem" }}>
                  {[
                    { label: "Waited after a drop", n: student.wait },
                    { label: "Split the practice bag", n: student.spread },
                    { label: "Read before buy", n: student.read },
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
              <div className="rb-empty">Pick a learner</div>
            )}
          </article>
        </div>
      ) : null}
    </RoleShell>
    </RequireRole>
  );
}
