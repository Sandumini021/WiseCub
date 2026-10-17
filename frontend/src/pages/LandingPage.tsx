import en from "../locales/en.json";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";

export function LandingPage() {
  return (
    <main id="main" className="page">
      <section className="hero">
        <p className="muted">{en.projectId}</p>
        <h1>{en.appName}</h1>
        <p className="lede">{en.tagline}</p>
        <p>
          For children aged 12–16. You get pretend money to practise saving,
          investing, decisions, and spotting scams. Nothing here is a real bank
          or a real trade.
        </p>
        <div className="hero-actions">
          <Button to="/market">{en.enterDemo}</Button>
        </div>
      </section>

      <section className="module-grid" aria-label="Four learning modules">
        <Card title={en.modules.market.title}>
          <p>{en.modules.market.blurb}</p>
        </Card>
        <Card title={en.modules.choices.title}>
          <p>{en.modules.choices.blurb}</p>
        </Card>
        <Card title={en.modules.missions.title}>
          <p>{en.modules.missions.blurb}</p>
        </Card>
        <Card title={en.modules.safety.title}>
          <p>{en.modules.safety.blurb}</p>
        </Card>
      </section>

      <p className="page-footer">{en.demoNotice}</p>
      <p className="page-footer">Cub is in the corner on every page. Type a chat, or tap Mic to speak.</p>
    </main>
  );
}
