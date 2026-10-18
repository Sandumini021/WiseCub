"""Rule-based indicators. Not a trained or clinically validated model."""

from __future__ import annotations

from typing import Any

from app.modules.stock_market.allocation import portfolio_allocation
from app.modules.stock_market.events import as_ms
from app.modules.stock_market.thresholds import DEFAULT_THRESHOLDS, BehaviourThresholds

LEVEL_INSUFFICIENT = "insufficient_evidence"
LEVEL_NOT_OBSERVED = "not_observed"
LEVEL_REVIEW = "worth_reviewing"

FILLS = {"buy_order_placed", "sell_order_placed"}


def _sorted(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(events, key=lambda item: as_ms(str(item.get("at") or "")))


def _between(events: list[dict[str, Any]], start_ms: int, end_ms: int, types: set[str], ticker: str | None = None):
    out = []
    for event in events:
        if event.get("type") not in types:
            continue
        stamp = as_ms(str(event.get("at") or ""))
        if stamp < start_ms or stamp > end_ms:
            continue
        if ticker and event.get("ticker") and event.get("ticker") != ticker:
            continue
        out.append(event)
    return out


def _period(events: list[dict[str, Any]]) -> dict[str, str | None]:
    if not events:
        return {"from": None, "to": None}
    ordered = _sorted(events)
    return {"from": ordered[0].get("at"), "to": ordered[-1].get("at")}


def _result(
    name: str,
    evidence: list[str],
    count: int,
    period: dict[str, str | None],
    level: str,
    explanation: str,
    activity: str,
    confidence: str,
) -> dict[str, Any]:
    return {
        "behaviour": name,
        "evidence": evidence,
        "occurrences": count,
        "period": period,
        "level": level,
        "confidence": confidence,
        "explanation": explanation,
        "suggested_activity": activity,
        "validated_assessment": False,
    }


def analyse_herd(events: list[dict[str, Any]], t: BehaviourThresholds) -> dict[str, Any]:
    cues = [e for e in events if e.get("type") == "market_trend_viewed"]
    fills = [e for e in events if e.get("type") in FILLS]
    period = _period(cues + fills)
    if len(cues) < t.herd_min_cues:
        return _result(
            "herd_behaviour",
            ["No simulated crowd cue was shown in this period."],
            0,
            period,
            LEVEL_INSUFFICIENT,
            "Herd following can only be discussed when an explicit crowd cue was on screen. Popular tickers alone are not evidence.",
            "Open the terminal when a practice crowd banner appears, then decide after reading the company note.",
            "insufficient",
        )
    hits = 0
    evidence: list[str] = [f"{len(cues)} crowd cue(s) shown."]
    for cue in cues:
        start = as_ms(str(cue.get("at") or ""))
        ticker = cue.get("ticker")
        trades = _between(fills, start, start + t.herd_cue_to_trade_ms, FILLS, ticker)
        for trade in trades:
            views = _between(
                events,
                start,
                as_ms(str(trade.get("at") or "")),
                {"company_viewed"},
                ticker,
            )
            reason = trade.get("reason") or ""
            followed_cue = "crowd" in reason.lower()
            if not views or followed_cue:
                hits += 1
                evidence.append(
                    f"Traded {trade.get('ticker')} within {t.herd_cue_to_trade_ms // 1000}s of cue {cue.get('scenario_id')} without a recorded company view (or the reason named the crowd)."
                )
    if hits >= t.herd_min_instances:
        return _result(
            "herd_behaviour",
            evidence,
            hits,
            period,
            LEVEL_REVIEW,
            "After a made-up crowd banner, a trade happened quickly without a recorded look at that company’s note. That is worth a pause, not a label.",
            "Lesson 1 review: what is a share, and what information would you want before copying others?",
            "limited",
        )
    evidence.append("Crowd cue was shown; no matching quick trade without research was recorded.")
    return _result(
        "herd_behaviour",
        evidence,
        0,
        period,
        LEVEL_NOT_OBSERVED,
        "A crowd cue appeared, but the recorded trades do not show following it without looking at the company note.",
        "Keep checking the company note even when a banner says ‘everyone’ bought.",
        "limited",
    )


def analyse_panic(events: list[dict[str, Any]], t: BehaviourThresholds) -> dict[str, Any]:
    drops = [
        e
        for e in events
        if e.get("type") == "price_drop_observed"
        and abs(float(e.get("change_pct") or 0)) >= t.panic_min_drop_pct
    ]
    sells = [e for e in events if e.get("type") == "sell_order_placed"]
    period = _period(drops + sells)
    if not drops:
        return _result(
            "panic_selling",
            ["No explicit simulated price-drop drill was shown."],
            0,
            period,
            LEVEL_INSUFFICIENT,
            "A red day on the chart is not enough. Panic is only reviewed after a labelled drop drill plus a large, fast sell.",
            "Try the sell ticket after the 9% SUNTEA drill and read ‘why it moved’ first.",
            "insufficient",
        )
    hits = 0
    evidence = [f"{len(drops)} labelled drop drill(s)."]
    for drop in drops:
        start = as_ms(str(drop.get("at") or ""))
        ticker = drop.get("ticker")
        for sell in _between(sells, start, start + t.drop_to_sell_ms, {"sell_order_placed"}, ticker):
            if sell.get("modified"):
                evidence.append(f"Sell of {ticker} was changed after Cub’s note — counted as noticing risk, not panic.")
                continue
            fraction = float(sell.get("sold_fraction") or 0)
            if fraction < t.panic_min_sold_fraction:
                continue
            start_sell = as_ms(str(sell.get("at") or ""))
            reviews = _between(
                events,
                start,
                start_sell,
                {"company_viewed", "risk_explanation_viewed"},
                ticker,
            )
            if reviews:
                evidence.append(f"Sold {ticker} after the drill but company or Cub text was opened first.")
                continue
            hits += 1
            evidence.append(
                f"Sold {fraction:.0%} of {ticker} within {t.drop_to_sell_ms // 1000}s of drill {drop.get('scenario_id')} with no recorded review."
            )
    if hits >= t.panic_min_instances:
        return _result(
            "panic_selling",
            evidence,
            hits,
            period,
            LEVEL_REVIEW,
            "A large slice was sold quickly after a practice drop, without a recorded look at the note. Feeling worried is normal; the habit to practise is pausing.",
            "Lesson 2: Risk and return — prices move both ways, and a drop is not a real bill here.",
            "limited",
        )
    return _result(
        "panic_selling",
        evidence,
        0,
        period,
        LEVEL_NOT_OBSERVED,
        "Drop drills were shown, but the recorded sells do not match a large, unreviewed reaction.",
        "If a drill drop appears, open ‘why it moved’ before tapping sell.",
        "limited",
    )


def analyse_overconfidence(events: list[dict[str, Any]], t: BehaviourThresholds) -> dict[str, Any]:
    fills = [e for e in _sorted(events) if e.get("type") in FILLS]
    period = _period(fills)
    if len(fills) < t.overconf_min_prior_trades:
        return _result(
            "overconfidence",
            [f"Only {len(fills)} filled practice order(s); need at least {t.overconf_min_prior_trades}."],
            0,
            period,
            LEVEL_INSUFFICIENT,
            "One winning trade is not overconfidence. We look for a bigger next order plus high concentration after a gain.",
            "Make a few small practice trades, then see whether order size jumps after a green one.",
            "insufficient",
        )
    hits = 0
    evidence: list[str] = []
    for i in range(1, len(fills)):
        prev, cur = fills[i - 1], fills[i]
        prev_notional = float(prev.get("price") or 0) * float(prev.get("shares") or 0)
        cur_notional = float(cur.get("price") or 0) * float(cur.get("shares") or 0)
        prev_px = float(prev.get("price") or 0)
        # A later sell/buy at a higher price than the previous fill on same ticker is a crude 'gain' cue.
        gained = prev.get("ticker") == cur.get("ticker") and prev_px > 0 and float(cur.get("price") or 0) > prev_px
        if prev.get("type") == "sell_order_placed" and float(prev.get("change_pct") or 0) > 0:
            gained = True
        if not gained or prev_notional <= 0:
            continue
        if cur_notional < prev_notional * t.overconf_size_ratio:
            continue
        conc = float(cur.get("concentration_pct") or 0)
        if conc < t.overconf_concentration_pct:
            continue
        start = as_ms(str(prev.get("at") or ""))
        end = as_ms(str(cur.get("at") or ""))
        risks = _between(events, start, end, {"risk_explanation_viewed"})
        if risks:
            evidence.append("Size increased after a gain, but Cub’s risk note was opened.")
            continue
        hits += 1
        evidence.append(
            f"After a gain, order size rose to {cur_notional:.0f} vs {prev_notional:.0f} with {conc:.0f}% in one name."
        )
    if hits:
        return _result(
            "overconfidence",
            evidence,
            hits,
            period,
            LEVEL_REVIEW,
            "After a successful practice outcome, the next order was much larger and more concentrated, without opening the risk note.",
            "Lesson 3: Spreading money — a win does not mean the next bet should be bigger.",
            "limited",
        )
    return _result(
        "overconfidence",
        evidence or ["Enough trades, but no size-up plus concentration after a gain without a risk note."],
        0,
        period,
        LEVEL_NOT_OBSERVED,
        "Recorded orders do not show a jump in size and concentration right after a gain.",
        "Keep order size steady even after a green practice trade.",
        "limited",
    )


def analyse_impulsive(events: list[dict[str, Any]], t: BehaviourThresholds) -> dict[str, Any]:
    fills = [e for e in _sorted(events) if e.get("type") in FILLS]
    period = _period(fills)
    if len(fills) < 2:
        return _result(
            "impulsive_investing",
            ["Fewer than two filled orders, so burst timing cannot be judged."],
            0,
            period,
            LEVEL_INSUFFICIENT,
            "Fast clicking needs at least two practice fills to talk about. Missing pauses are not assumed.",
            "Place two slow practice orders and open the company note between them.",
            "insufficient",
        )
    hits = 0
    evidence: list[str] = []
    for i, fill in enumerate(fills):
        start = as_ms(str(fill.get("at") or ""))
        window = [
            other
            for other in fills
            if start <= as_ms(str(other.get("at") or "")) <= start + t.impulsive_burst_ms
        ]
        if len(window) >= t.impulsive_burst_count:
            hits += 1
            evidence.append(f"{len(window)} fills inside {t.impulsive_burst_ms // 1000}s starting {fill.get('at')}.")
            break
    for i in range(1, len(fills)):
        prev, cur = fills[i - 1], fills[i]
        gap = as_ms(str(cur.get("at") or "")) - as_ms(str(prev.get("at") or ""))
        if gap > t.impulsive_gap_ms:
            continue
        views = _between(
            events,
            as_ms(str(prev.get("at") or "")),
            as_ms(str(cur.get("at") or "")),
            {"company_viewed", "risk_explanation_viewed"},
        )
        if views:
            continue
        if cur.get("modified") or prev.get("modified"):
            continue
        hits += 1
        evidence.append(f"Two fills {gap / 1000:.1f}s apart with no company or Cub note between them.")
    reverses = 0
    for i in range(1, len(fills)):
        a, b = fills[i - 1], fills[i]
        if a.get("ticker") == b.get("ticker") and a.get("type") != b.get("type"):
            gap = as_ms(str(b.get("at") or "")) - as_ms(str(a.get("at") or ""))
            if gap <= t.impulsive_burst_ms:
                reverses += 1
    if reverses:
        evidence.append(f"{reverses} buy/sell reverse(s) of the same ticker inside the burst window.")
        hits += reverses
    if hits >= t.impulsive_min_instances:
        return _result(
            "impulsive_investing",
            evidence,
            hits,
            period,
            LEVEL_REVIEW,
            "Several practice orders landed very close together without a recorded look at the note. That can be rushing.",
            "Lesson 2: wait through a wobble before the next tap.",
            "limited",
        )
    return _result(
        "impulsive_investing",
        evidence or ["Gaps between fills were longer, or a note was opened in between."],
        0,
        period,
        LEVEL_NOT_OBSERVED,
        "The recorded timing does not show a rush cluster without information views.",
        "Keep a short pause and open the company note between orders.",
        "limited",
    )


def analyse_diversification(
    events: list[dict[str, Any]],
    t: BehaviourThresholds,
    snapshot: dict[str, Any] | None = None,
) -> dict[str, Any]:
    alloc = snapshot
    if not alloc:
        reviewed = [e for e in _sorted(events) if e.get("type") == "portfolio_reviewed" and e.get("holdings") is not None]
        last = reviewed[-1] if reviewed else next(
            (e for e in reversed(_sorted(events)) if e.get("type") in FILLS and (e.get("holdings") or e.get("cash") is not None)),
            None,
        )
        if last:
            alloc = portfolio_allocation(
                float(last.get("cash") or 0),
                list(last.get("holdings") or []),
            )
    period = _period(events)
    if not alloc or not alloc.get("usable"):
        return _result(
            "poor_diversification",
            ["No usable portfolio total (cash + holdings) was recorded."],
            0,
            period,
            LEVEL_INSUFFICIENT,
            "Concentration is only computed when the practice bag has a value. Zero is not treated as ‘well spread’.",
            "Buy a few slices, then open My portfolio.",
            "insufficient",
        )
    largest = float(alloc.get("largest_company_pct") or 0)
    ticker = alloc.get("largest_ticker")
    cash_pct = alloc.get("cash_pct")
    evidence = [
        f"Largest name {ticker or '—'} is {largest:.1f}% of cash+holdings.",
        f"Cash is {cash_pct:.1f}% of the bag.",
    ]
    if largest >= t.concentration_pct:
        return _result(
            "poor_diversification",
            evidence,
            1,
            period,
            LEVEL_REVIEW,
            f"Most of the practice bag depends on {ticker}. If that story goes badly, the whole bag wobbles.",
            "Lesson 3: Spreading money — split virtual cash across more than one fictional company.",
            "moderate",
        )
    return _result(
        "poor_diversification",
        evidence,
        0,
        period,
        LEVEL_NOT_OBSERVED,
        "No single fictional company is at or above the 40% practice threshold.",
        "Keep checking the mix when you buy more slices.",
        "moderate",
    )


def analyse_research(events: list[dict[str, Any]], t: BehaviourThresholds) -> dict[str, Any]:
    fills = [e for e in _sorted(events) if e.get("type") in FILLS]
    views = [e for e in events if e.get("type") in {"company_viewed", "risk_explanation_viewed"}]
    period = _period(fills + views)
    if len(fills) < t.research_min_orders:
        return _result(
            "insufficient_research",
            [f"{len(fills)} order(s); need {t.research_min_orders} to talk about a pattern."],
            0,
            period,
            LEVEL_INSUFFICIENT,
            "Not opening a note once is not a pattern. We only describe what was tapped inside WiseCub, never homework outside it.",
            "Open a ticker’s ‘why it moved’ text, then place a practice order.",
            "insufficient",
        )
    skipped = 0
    evidence: list[str] = []
    for fill in fills:
        end = as_ms(str(fill.get("at") or ""))
        start = end - t.research_window_ms
        found = _between(
            events,
            start,
            end,
            {"company_viewed", "risk_explanation_viewed"},
            fill.get("ticker"),
        )
        if found:
            continue
        skipped += 1
        evidence.append(f"{fill.get('side')} {fill.get('ticker')} with no in-app note in the {t.research_window_ms // 1000}s before.")
    if skipped >= 2:
        return _result(
            "insufficient_research",
            evidence,
            skipped,
            period,
            LEVEL_REVIEW,
            "More than one practice order was placed without a recorded look at that company’s note or Cub’s risk text in WiseCub.",
            "Lesson 1 review: read the pie and the ‘why it moved’ line before the next order.",
            "limited",
        )
    return _result(
        "insufficient_research",
        evidence or ["Orders had a company or Cub note in the window beforehand."],
        skipped,
        period,
        LEVEL_NOT_OBSERVED,
        "In-app notes were opened before most recorded orders. This does not describe research outside WiseCub.",
        "Keep opening the company note; it is the evidence we can see.",
        "limited",
    )


def analyse_events(
    events: list[dict[str, Any]],
    snapshot: dict[str, Any] | None = None,
    thresholds: BehaviourThresholds | None = None,
) -> dict[str, Any]:
    t = thresholds or DEFAULT_THRESHOLDS
    indicators = [
        analyse_herd(events, t),
        analyse_panic(events, t),
        analyse_overconfidence(events, t),
        analyse_impulsive(events, t),
        analyse_diversification(events, t, snapshot),
        analyse_research(events, t),
    ]
    return {
        "engine": "rule_based_v1",
        "trained_model": False,
        "indicators": indicators,
        "event_count": len(events),
        "disclaimer": "Rule-based practice signals only. Not a psychological diagnosis. Missing taps are not good or bad character.",
    }
