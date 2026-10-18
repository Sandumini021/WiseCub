"""Configurable rule thresholds.

These are starting values for a practice simulator with children aged 12–16.
They are not validated clinical cut-offs. A single match is never enough on
its own; the engine also requires explicit cues and supporting events.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class BehaviourThresholds:
    # Herd: trade after an explicit crowd cue, without opening company info.
    # 3 minutes: long enough to act on the banner, short enough to still be
    # a reaction to that cue rather than a later independent choice.
    herd_cue_to_trade_ms: int = 180_000
    herd_min_instances: int = 1
    herd_min_cues: int = 1

    # Panic sell: after an explicit simulated drop drill, a large sell of
    # that ticker without reviewing info. 2 minutes matches a “react now”
    # window on a short demo screen. 50% of that holding is “a lot”, not any sale.
    drop_to_sell_ms: int = 120_000
    panic_min_sold_fraction: float = 0.5
    panic_min_drop_pct: float = 8.0
    panic_min_instances: int = 1

    # Overconfidence: size-up after a gain AND high concentration, without
    # opening the risk note. 1.5× notional is a clear size jump in a demo.
    overconf_size_ratio: float = 1.5
    overconf_concentration_pct: float = 40.0
    overconf_min_prior_trades: int = 2

    # Impulsive: three fills inside 90s, or two fills < 15s apart without a
    # company view between them. Chosen for a click-through demo, not real
    # brokerage latency. Change here rather than hard-coding in the UI.
    impulsive_burst_ms: int = 90_000
    impulsive_burst_count: int = 3
    impulsive_gap_ms: int = 15_000
    impulsive_min_instances: int = 1

    # Research: a company_viewed in the 2 minutes before an order counts as
    # in-app research. Absence only means “not observed in WiseCub”.
    research_window_ms: int = 120_000
    research_min_orders: int = 2

    # Diversification: same 40% single-name share already used on confirm.
    # Equity (cash + holdings) is the denominator.
    concentration_pct: float = 40.0


DEFAULT_THRESHOLDS = BehaviourThresholds()
