import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { applyTaxRule, rupees, type TaxRule } from "../data/applyTax";
import { gradeTaxQuiz } from "../taxApi";
import { TaxCub, useTaxLab } from "./TaxShell";

function pickRule(rules: TaxRule[], id: string) {
  return rules.find((item) => item.id === id) ?? rules[0];
}

export function TaxHomePage() {
  const { lessons, progress, lang } = useTaxLab();
  return (
    <div className="tax-home">
      <TaxCub
        text={
          lang === "si"
            ? "මෙය Common Area එකේ බදු lab එකයි. වෙළෙඳපොළ හෝ missions නෙවෙයි. අභ්‍යාස රුපියල් සහ ලේබල් කළ IRD රූප."
            : "This is the common-area tax lab — not Market, Missions, Safety, or Choices. Practice numbers, plus labelled IRD 2025/2026 figures."
        }
      />
      <ul className="tax-cards">
        <li>
          <Link to="/tax/learn">
            <strong>Learn</strong>
            <span>
              {progress.lessons.length}/{lessons.length} lessons
            </span>
          </Link>
        </li>
        <li>
          <Link to="/tax/simulate">
            <strong>Simulator</strong>
            <span>Income, relief, bands, net</span>
          </Link>
        </li>
        <li>
          <Link to="/tax/challenge">
            <strong>Threshold challenge</strong>
            <span>What happens when income rises?</span>
          </Link>
        </li>
        <li>
          <Link to="/tax/decisions">
            <strong>Smart money</strong>
            <span>Spend, save, set aside (budgeting)</span>
          </Link>
        </li>
        <li>
          <Link to="/tax/quiz">
            <strong>Quiz</strong>
            <span>{progress.quizPoints} pts</span>
          </Link>
        </li>
        <li>
          <Link to="/tax/sri-lanka">
            <strong>Sri Lanka awareness</strong>
            <span>YA 2025/2026 · sourced</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function TaxLearnPage() {
  const { lessons, progress, saveProgress, lang } = useTaxLab();
  const { id } = useParams();
  const lesson = lessons.find((item) => item.id === id) ?? lessons[0];
  const [beat, setBeat] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    setBeat(0);
    setPick(null);
    setChecked(false);
  }, [lesson?.id]);
  if (!lesson) {
    return <p>No lessons.</p>;
  }
  const ok = pick === lesson.check.correct;
  return (
    <div className="tax-learn">
      <TaxCub text={lesson.blurb} />
      <ol className="tax-lesson-list">
        {lessons.map((item) => (
          <li key={item.id}>
            <Link to={`/tax/learn/${item.id}`} className={item.id === lesson.id ? "is-on" : ""}>
              {item.title}
              {progress.lessons.includes(item.id) ? " ✓" : ""}
            </Link>
          </li>
        ))}
      </ol>
      <h2>{lesson.title}</h2>
      <div className="ls-beats">
        {lesson.beats.map((item, index) => (
          <button key={item.t} type="button" className={beat === index ? "is-on" : ""} onClick={() => setBeat(index)}>
            {item.t}
          </button>
        ))}
      </div>
      <p className="tax-beat">{lesson.beats[beat]?.d}</p>
      <h3>{lang === "si" ? "කුඩා ප්‍රශ්නය" : "Quick check"}</h3>
      {lesson.check.options.map((option) => (
        <label key={option.id} className="tax-opt">
          <input
            type="radio"
            name="tax-check"
            checked={pick === option.id}
            onChange={() => {
              setPick(option.id);
              setChecked(false);
            }}
          />
          {option.label}
        </label>
      ))}
      <button type="button" className="btn-gold" disabled={!pick} onClick={() => setChecked(true)}>
        Check
      </button>
      {checked ? <p className={ok ? "tax-ok" : "tax-err"}>{ok ? "Cub: yes." : "Try again."}</p> : null}
      {checked && ok ? (
        <button
          type="button"
          className="btn-gold"
          onClick={() => {
            if (!progress.lessons.includes(lesson.id)) {
              const lessonsDone = [...progress.lessons, lesson.id];
              const badges = lessonsDone.length >= lessons.length ? ["tax-learner"] : progress.badges;
              saveProgress({ ...progress, lessons: lessonsDone, badges });
            }
          }}
        >
          Save lesson
        </button>
      ) : null}
    </div>
  );
}

function ResultPanel({
  rule,
  income,
  kind,
}: {
  rule: TaxRule;
  income: number;
  kind: string;
}) {
  const result = useMemo(() => applyTaxRule(rule, income, kind), [rule, income, kind]);
  const max = Math.max(result.gross, 1);
  return (
    <section className={`tax-result is-${rule.mode}`}>
      <p className="tax-mode">{rule.mode === "verified" ? "IRD-labelled YA 2025/2026" : "Hypothetical practice"}</p>
      {rule.expired ? <p className="tax-warn">Historical YA only — not confirmed as current law after 31 Mar 2026.</p> : null}
      <dl>
        <div>
          <dt>Gross</dt>
          <dd>{rupees(result.gross)}</dd>
        </div>
        <div>
          <dt>Relief used</dt>
          <dd>{rupees(result.reliefUsed)}</dd>
        </div>
        <div>
          <dt>Taxable</dt>
          <dd>{rupees(result.taxable)}</dd>
        </div>
        <div>
          <dt>Est. tax</dt>
          <dd>{rupees(result.tax)}</dd>
        </div>
        <div>
          <dt>Net</dt>
          <dd>{rupees(result.net)}</dd>
        </div>
      </dl>
      <div className="tax-bars" aria-hidden="true">
        <i className="is-gross" style={{ width: "100%" }} />
        <i className="is-tax" style={{ width: `${(result.tax / max) * 100}%` }} />
      </div>
      <ol className="tax-steps">
        {result.slices
          .filter((row) => row.amount_in_band > 0)
          .map((row) => (
            <li key={row.index}>
              Band {row.index + 1}: {rupees(row.amount_in_band)} × {Number(row.rate) * 100}% = {rupees(row.tax)}
            </li>
          ))}
      </ol>
      {result.crossedRelief ? (
        <p>Only the part above relief is taxable. Extra rupees do not re-tax the whole amount at a higher rate.</p>
      ) : (
        <p>Still inside the relief. Estimated tax stays Rs 0.00.</p>
      )}
    </section>
  );
}

export function TaxSimulatePage() {
  const { scenarios, rules, lang } = useTaxLab();
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "tutoring");
  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  const [ruleId, setRuleId] = useState(scenario?.suggested_rule ?? "practice_simple");
  const rule = pickRule(rules, ruleId);
  const [income, setIncome] = useState(Number(scenario?.default_income ?? 0));
  if (!scenario || !rule) {
    return <p>Need the API.</p>;
  }
  const max = rule.mode === "verified" ? 5_000_000 : 200_000;
  return (
    <div>
      <TaxCub
        text={
          lang === "si"
            ? "Slider එකෙන් ආදායම වෙනස් කරන්න. සහනය, බදු යටතේ ආදායම, තීරු, ශුද්ධ එකවර යාවත්කාලීන වෙනවා."
            : "Slide income. Relief, taxable income, bands, and net update together. Yellow = practice. Blue = labelled IRD 2025/2026."
        }
      />
      <label>
        Scenario
        <select
          value={scenarioId}
          onChange={(event) => {
            const next = scenarios.find((item) => item.id === event.target.value);
            setScenarioId(event.target.value);
            if (next) {
              setIncome(Number(next.default_income));
              setRuleId(next.suggested_rule);
            }
          }}
        >
          {scenarios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <p>{scenario.story}</p>
      {scenario.saved_pile ? <p>Saved pile (not tax): {rupees(Number(scenario.saved_pile))}</p> : null}
      <label>
        Rule
        <select value={ruleId} onChange={(event) => setRuleId(event.target.value)}>
          {rules.map((item) => (
            <option key={item.id} value={item.id}>
              {item.mode === "verified" ? "Sri Lanka YA 2025/2026 (sourced)" : "Hypothetical practice"}
            </option>
          ))}
        </select>
      </label>
      <label>
        Annual income
        <input type="range" min={0} max={max} step={rule.mode === "verified" ? 10000 : 1000} value={income} onChange={(event) => setIncome(Number(event.target.value))} />
        <input type="number" min={0} value={income} onChange={(event) => setIncome(Math.max(0, Number(event.target.value)))} />
      </label>
      <ResultPanel rule={rule} income={income} kind={scenario.income_kind} />
    </div>
  );
}

export function TaxChallengePage() {
  const { rules, lang } = useTaxLab();
  const rule = pickRule(rules, "practice_simple");
  const relief = Number(rule?.personal_relief ?? 50000);
  const [income, setIncome] = useState(relief - 10000);
  const [guess, setGuess] = useState<"zero" | "some" | "all-top" | null>(null);
  const [shown, setShown] = useState(false);
  if (!rule) {
    return <p>Need the API.</p>;
  }
  const result = applyTaxRule(rule, income);
  return (
    <div>
      <h2>{lang === "si" ? "ආදායම වැඩි උනාම මොකද වෙන්නේ?" : "What happens when your income increases?"}</h2>
      <TaxCub
        text={
          lang === "si"
            ? "මුලින් අනාවැකියක් කියන්න. ඊට පස්සේ ගණනය පෙන්වනවා."
            : "Guess first. Then reveal the live calculation."
        }
      />
      <input type="range" min={0} max={200000} step={1000} value={income} onChange={(event) => setIncome(Number(event.target.value))} />
      <p>
        Compare: below {rupees(relief - 1)} · at {rupees(relief)} · above {rupees(relief + 20000)}
      </p>
      <fieldset>
        <legend>If income is {rupees(income)}, estimated tax is…</legend>
        <label>
          <input type="radio" name="g" onChange={() => setGuess("zero")} /> Zero
        </label>
        <label>
          <input type="radio" name="g" onChange={() => setGuess("some")} /> Some — only the slice above relief
        </label>
        <label>
          <input type="radio" name="g" onChange={() => setGuess("all-top")} /> The whole amount at the top rate
        </label>
      </fieldset>
      <button type="button" className="btn-gold" disabled={!guess} onClick={() => setShown(true)}>
        Reveal
      </button>
      {shown ? (
        <>
          <p className={guess === "all-top" ? "tax-err" : "tax-ok"}>
            {guess === "all-top"
              ? "Not that. Progressive bands never re-tax the whole cake at the new rate."
              : result.tax === 0
                ? "Yes — still inside relief."
                : "The extra slice is taxed; earlier rupees keep the lower treatment."}
          </p>
          <ResultPanel rule={rule} income={income} kind="tutoring" />
        </>
      ) : null}
    </div>
  );
}

export function TaxDecisionsPage() {
  const { lang } = useTaxLab();
  const received = 20000;
  const [spend, setSpend] = useState(8000);
  const [save, setSave] = useState(9000);
  const reserve = Math.max(0, received - spend - save);
  return (
    <div>
      <h2>{lang === "si" ? "නුවණින් බෙදන එක" : "Smart money decisions"}</h2>
      <TaxCub
        text={
          lang === "si"
            ? "රු. 20,000 ආවා. වියදම්, ඉතිරි, සහ බදු බිලක් ආවොත් කියලා වෙන් කිරීම — අයවැය අභ්‍යාසයක්, හැම විටම නීතියක් නෙවෙයි."
            : "You received Rs 20,000. Split spend / save / maybe-tax reserve. Setting money aside is a budgeting exercise, not a law that always applies."
        }
      />
      <p>Received (gross in this story): {rupees(received)}</p>
      <label>
        Spend {rupees(spend)}
        <input type="range" min={0} max={received} value={spend} onChange={(event) => setSpend(Number(event.target.value))} />
      </label>
      <label>
        Save {rupees(save)}
        <input type="range" min={0} max={received} value={save} onChange={(event) => setSave(Number(event.target.value))} />
      </label>
      <p>Left as a maybe-tax reserve: {rupees(reserve)}</p>
      <ul>
        <li>Money received ≠ money saved.</li>
        <li>Saved pile ≠ taxable income.</li>
        <li>Tax payable is a later estimate on income that the rules cover.</li>
        <li>Net disposable here ≈ received − spend − reserve.</li>
      </ul>
    </div>
  );
}

export function TaxQuizPage() {
  const { quiz, progress, saveProgress, lang } = useTaxLab();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState<string | null>(null);
  const item = quiz[index];
  if (!item) {
    return <p>No quiz.</p>;
  }
  async function submit() {
    const current = quiz[index];
    if (!current) {
      return;
    }
    const body =
      current.kind === "mcq"
        ? { question_id: current.id, choice: choice ?? undefined }
        : { question_id: current.id, amount };
    const result = await gradeTaxQuiz(body);
    setNote(result.hint);
    if (result.ok) {
      saveProgress({
        ...progress,
        quizPoints: progress.quizPoints + result.points,
        badges: progress.quizPoints + result.points >= 40 ? [...new Set([...progress.badges, "tax-quiz"])] : progress.badges,
      });
    }
  }
  return (
    <div>
      <TaxCub text={lang === "si" ? "වැරැද්දට retry කරන්න පුළුවන්. ලකුණු Common Area progress එකට යනවා." : "Retry is allowed. Points save on the common demo profile."} />
      <p>
        {index + 1}/{quiz.length} · {progress.quizPoints} pts
      </p>
      <h2>{item.q}</h2>
      {item.kind === "mcq"
        ? item.options?.map((option) => (
            <label key={option.id} className="tax-opt">
              <input type="radio" name="q" checked={choice === option.id} onChange={() => setChoice(option.id)} />
              {option.label}
            </label>
          ))
        : (
            <input type="number" min={0} value={amount} onChange={(event) => setAmount(event.target.value)} />
          )}
      <button type="button" className="btn-gold" onClick={() => void submit()}>
        Check
      </button>
      {note ? <p>{note}</p> : null}
      <button type="button" className="btn-ghost" onClick={() => { setIndex((n) => Math.min(quiz.length - 1, n + 1)); setNote(null); setChoice(null); }}>
        Next
      </button>
    </div>
  );
}

export function TaxSriLankaPage() {
  const { rules, lang } = useTaxLab();
  const rule = pickRule(rules, "lk_pit_2025_2026");
  const [income, setIncome] = useState(2_800_000);
  if (!rule) {
    return <p>Need the API.</p>;
  }
  return (
    <div>
      <h2>{lang === "si" ? "ශ්‍රී ලංකා බදු දැනුවත්භාවය" : "Sri Lanka tax awareness"}</h2>
      <TaxCub
        text={
          lang === "si"
            ? "මේ රූප IRD YA 2025/2026. වත්මන් නීතිය කියලා 2026 අප්‍රේල්ට පස්සේ තහවුරු වෙලා නැහැ. උපදෙස් නෙවෙයි."
            : "These figures are sourced for YA 2025/2026. They are not confirmed as current law after 31 March 2026. Not advice."
        }
      />
      <p>
        Year of assessment <strong>{rule.year_of_assessment}</strong> · verified {rule.verification_date} ·{" "}
        {rule.expired ? "historical (not current)" : "within published period"}
      </p>
      <ul>
        {rule.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.title}
            </a>
          </li>
        ))}
      </ul>
      <ul>
        {rule.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <p>Turn the slider with the official 2025/2026 configuration. Banner stays on.</p>
      <input type="range" min={0} max={5000000} step={10000} value={income} onChange={(event) => setIncome(Number(event.target.value))} />
      <ResultPanel rule={rule} income={income} kind="employment" />
    </div>
  );
}
