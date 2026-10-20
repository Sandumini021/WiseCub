"""
Synthetic Dataset Generator for WiseCub CDEMF Machine Learning
==============================================================
Generates exactly 2,500 synthetic gameplay decision records across 300
simulated student profiles across all three story missions:
  - Rescue the Injured Puppy (8 levels)
  - Squirrel's Winter Savings (6 levels)
  - Panda's School Fair (6 levels)

Uses actual CDEMF catalog constraints and runs decisions through the authentic
CDEMF evaluation engine (run_cdemf_pipeline).
"""
from __future__ import annotations

import csv
import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parents[4]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.modules.gamified_learning.catalog import (
    LevelDefinition,
    get_mission,
)
from app.modules.gamified_learning.engine import (
    CharacterState,
    run_cdemf_pipeline,
)
from app.modules.gamified_learning.ml.paths import (
    CSV_DATASET_PATH,
    JSONL_DATASET_PATH,
)
from app.modules.gamified_learning.ml.schemas import (
    ArchetypeType,
    SupportNeedLabel,
    SyntheticGameplayRecord,
)

TOTAL_RECORDS = 2500
TOTAL_STUDENTS = 300
RANDOM_SEED = 42

ARCHETYPE_COUNTS: dict[ArchetypeType, int] = {
    "STRUGGLING_LEARNER": 75,
    "IMPULSIVE_SPENDER": 75,
    "CAUTIOUS_IMPROVER": 90,
    "ADVANCED_ACHIEVER": 60,
}

BASE_START_TIME = datetime(2026, 1, 15, 9, 0, 0, tzinfo=timezone.utc)


def _default_char_state(mission_id: str) -> CharacterState:
    mission = get_mission(mission_id)
    if not mission:
        raise ValueError(f"Mission {mission_id} not found in catalog.")
    if mission_id == "mission_panda_fair":
        return CharacterState(
            character_id="char_panda_baobao",
            name="Bao Bao",
            physical_condition="WEAK_STABILIZED",
            emotional_state="EXCITED",
            condition_description="Bao Bao is eagerly preparing for the School Charity Fair.",
            vitality_score=mission.initial_vitality,
            happiness_score=mission.initial_happiness,
            active_dialogue="Welcome to the School Fair planning committee!",
            budget_health=60,
            fair_readiness=30,
            charity_goal_progress=0,
            vendor_relationships=50,
            customer_satisfaction=50,
            financial_risk_exposure=35,
            emotional_wellbeing=60,
        )
    if mission_id == "mission_squirrel_savings":
        return CharacterState(
            character_id="char_squirrel_nutty",
            name="Nutty",
            physical_condition="NEEDS_CARE",
            emotional_state="WORRIED",
            condition_description="Nutty's winter pantry is nearly empty.",
            vitality_score=mission.initial_vitality,
            happiness_score=mission.initial_happiness,
            active_dialogue="Winter frost is coming early this year!",
            food_supply=35,
            savings_reserve=25,
            shelter_readiness=30,
            winter_preparedness=30,
            emotional_wellbeing=40,
        )
    return CharacterState(
        character_id=mission.character_id,
        name=mission.character_name,
        physical_condition="NEEDS_CARE",
        emotional_state="WORRIED",
        condition_description=f"{mission.character_name} is injured and needs your help.",
        vitality_score=mission.initial_vitality,
        happiness_score=mission.initial_happiness,
        active_dialogue="Whimper... Can you help me get proper care?",
    )


class SimulatedStudent:
    """Represents a synthetic student with evolving latent competencies."""

    def __init__(self, student_id: str, archetype: ArchetypeType, mission_cohort: str, rng: random.Random):
        self.student_id = student_id
        self.archetype = archetype
        self.rng = rng
        self.step_index = 0
        self.current_time = BASE_START_TIME + timedelta(
            minutes=self.rng.randint(0, 1440 * 7),
            seconds=self.rng.randint(0, 3600),
        )

        # Latent competencies (0.0 to 100.0)
        if archetype == "STRUGGLING_LEARNER":
            self.theta_budgeting = self.rng.gauss(55.0, 5.0)
            self.theta_discipline = self.rng.gauss(50.0, 5.0)
            self.theta_saving = self.rng.gauss(52.0, 5.0)
            self.theta_planning = self.rng.gauss(50.0, 5.0)
            self.temptation_bias = 0.50
            self.learning_rate = 8.0
        elif archetype == "IMPULSIVE_SPENDER":
            self.theta_budgeting = self.rng.gauss(78.0, 4.0)
            self.theta_discipline = self.rng.gauss(48.0, 6.0)
            self.theta_saving = self.rng.gauss(56.0, 5.0)
            self.theta_planning = self.rng.gauss(72.0, 4.0)
            self.temptation_bias = 0.55
            self.learning_rate = 8.5
        elif archetype == "CAUTIOUS_IMPROVER":
            self.theta_budgeting = self.rng.gauss(80.0, 4.0)
            self.theta_discipline = self.rng.gauss(78.0, 4.0)
            self.theta_saving = self.rng.gauss(82.0, 4.0)
            self.theta_planning = self.rng.gauss(76.0, 4.0)
            self.temptation_bias = 0.15
            self.learning_rate = 7.5
        else:  # ADVANCED_ACHIEVER
            self.theta_budgeting = self.rng.gauss(92.0, 3.0)
            self.theta_discipline = self.rng.gauss(94.0, 2.5)
            self.theta_saving = self.rng.gauss(92.0, 3.0)
            self.theta_planning = self.rng.gauss(90.0, 3.0)
            self.temptation_bias = 0.04
            self.learning_rate = 5.0

        for attr in ("theta_budgeting", "theta_discipline", "theta_saving", "theta_planning"):
            val = max(25.0, min(99.0, getattr(self, attr)))
            setattr(self, attr, val)

        # Mission sequence based on cohort
        if mission_cohort == "puppy":
            self.missions_sequence = ["mission_rescue_puppy", "mission_squirrel_savings", "mission_panda_fair"]
        elif mission_cohort == "squirrel":
            self.missions_sequence = ["mission_squirrel_savings", "mission_panda_fair", "mission_rescue_puppy"]
        else:
            self.missions_sequence = ["mission_panda_fair", "mission_rescue_puppy", "mission_squirrel_savings"]

        self.active_mission_idx = 0
        self.current_level_num = 1
        self.current_attempt_num = 1
        self.char_state = _default_char_state(self.missions_sequence[0])

        self.history: list[dict[str, Any]] = []

    def get_active_mission_id(self) -> str:
        return self.missions_sequence[min(self.active_mission_idx, len(self.missions_sequence) - 1)]

    def compute_lagged_features(self) -> dict[str, Any]:
        """Calculates features strictly from past attempts (< current step)."""
        if not self.history:
            return {
                "hist_completed_levels_count": 0,
                "hist_prior_attempts_count": 0,
                "hist_retry_rate": 0.0,
                "hist_remediation_count": 0,
                "hist_avg_budgeting_score": 50.0,
                "hist_avg_spending_score": 50.0,
                "hist_avg_saving_score": 50.0,
                "hist_avg_investment_score": 50.0,
                "hist_avg_planning_score": 50.0,
                "hist_avg_emergency_prep_score": 50.0,
                "hist_overall_score_avg": 50.0,
                "hist_consecutive_fails": 0,
                "hist_consecutive_passes": 0,
            }

        n_att = len(self.history)
        retries = sum(1 for h in self.history if h["attempt_number"] > 1)
        remediations = sum(1 for h in self.history if h["remediation_triggered"])
        completed = len(set((h["mission_id"], h["level_number"]) for h in self.history if h["passed"]))

        avg_b = sum(h["score_budgeting"] for h in self.history) / n_att
        avg_sp = sum(h["score_spending"] for h in self.history) / n_att
        avg_sv = sum(h["score_saving"] for h in self.history) / n_att
        avg_inv = sum(h["score_investment"] for h in self.history) / n_att
        avg_pl = sum(h["score_goal"] for h in self.history) / n_att
        avg_em = sum(h["score_emergency_prep"] for h in self.history) / n_att
        avg_ov = sum(h["overall_score"] for h in self.history) / n_att

        c_fails = 0
        for h in reversed(self.history):
            if not h["passed"]:
                c_fails += 1
            else:
                break

        c_passes = 0
        for h in reversed(self.history):
            if h["passed"]:
                c_passes += 1
            else:
                break

        return {
            "hist_completed_levels_count": completed,
            "hist_prior_attempts_count": n_att,
            "hist_retry_rate": round(retries / n_att, 4),
            "hist_remediation_count": remediations,
            "hist_avg_budgeting_score": round(avg_b, 2),
            "hist_avg_spending_score": round(avg_sp, 2),
            "hist_avg_saving_score": round(avg_sv, 2),
            "hist_avg_investment_score": round(avg_inv, 2),
            "hist_avg_planning_score": round(avg_pl, 2),
            "hist_avg_emergency_prep_score": round(avg_em, 2),
            "hist_overall_score_avg": round(avg_ov, 2),
            "hist_consecutive_fails": c_fails,
            "hist_consecutive_passes": c_passes,
        }

    def generate_decision(self, level: LevelDefinition) -> dict[str, Any]:
        """Synthesizes student decision inputs influenced by latent competencies and retries."""
        interaction_type = level.interaction_type
        budget = level.starting_budget_lkr

        selected_option_ids: list[str] = []
        allocations: dict[str, int] = {}
        weekly_decisions: list[dict] = []
        selected_rationale_id: str | None = None

        retry_bonus = 0.35 if self.current_attempt_num > 1 else 0.0

        if interaction_type in ("needs_wants", "value_comparison", "emergency_response", "tradeoff_justification"):
            options = level.options
            essential_opts = [o for o in options if o.is_essential]
            non_essential_opts = [o for o in options if not o.is_essential]
            must_include_ids = level.pass_criteria.must_include_option_ids
            disallowed_ids = level.pass_criteria.disallowed_option_ids

            # Likelihood of properly identifying required essentials
            if self.archetype == "ADVANCED_ACHIEVER":
                p_cover_all_essentials = 0.98
                p_pick_disallowed = 0.01
            elif self.archetype == "CAUTIOUS_IMPROVER":
                p_cover_all_essentials = 0.92 + retry_bonus * 0.2
                p_pick_disallowed = 0.04 - retry_bonus * 0.03
            elif self.archetype == "IMPULSIVE_SPENDER":
                p_cover_all_essentials = 0.85 + retry_bonus * 0.3
                p_pick_disallowed = 0.30 - retry_bonus * 0.25
            else:  # STRUGGLING_LEARNER
                p_cover_all_essentials = 0.65 + retry_bonus * 0.35
                p_pick_disallowed = 0.25 - retry_bonus * 0.20

            # 1. Essential options selection
            if self.rng.random() < p_cover_all_essentials:
                for o in essential_opts:
                    selected_option_ids.append(o.id)
            else:
                # Miss one essential option on struggle
                for o in essential_opts[:-1]:
                    selected_option_ids.append(o.id)

            # Ensure if must_include specified, prioritize them if competent
            for req_id in must_include_ids:
                if req_id not in selected_option_ids and self.rng.random() < (p_cover_all_essentials + 0.05):
                    selected_option_ids.append(req_id)

            # 2. Disallowed / luxury options
            if disallowed_ids and self.rng.random() < p_pick_disallowed:
                selected_option_ids.append(self.rng.choice(disallowed_ids))

            # 3. Safe optional discretionary options within budget
            safe_non_essentials = [o for o in non_essential_opts if o.id not in disallowed_ids]
            p_safe_extra = max(0.05, min(0.60, self.temptation_bias - retry_bonus * 0.2))
            for o in safe_non_essentials:
                if self.rng.random() < p_safe_extra:
                    current_cost = sum(opt.cost_lkr for opt in options if opt.id in selected_option_ids)
                    if current_cost + o.cost_lkr <= budget:
                        selected_option_ids.append(o.id)

            # 4. Trade-off rationale
            if level.tradeoff_rationales:
                sound_rats = [r for r in level.tradeoff_rationales if r.is_sound]
                unsound_rats = [r for r in level.tradeoff_rationales if not r.is_sound]
                p_sound = min(0.98, max(0.45, (self.theta_planning / 100.0) + retry_bonus * 0.4))
                if (self.rng.random() < p_sound or not unsound_rats) and sound_rats:
                    selected_rationale_id = sound_rats[0].id
                elif unsound_rats:
                    selected_rationale_id = unsound_rats[0].id

        elif interaction_type in ("budget_allocator", "recurring_budget", "capstone_challenge"):
            cats = level.allocation_categories
            remaining = budget
            for c in cats:
                if c.is_essential:
                    # Allocate recommended min or close
                    if self.archetype == "STRUGGLING_LEARNER" and self.current_attempt_num == 1 and self.rng.random() < 0.25:
                        amt = max(0, c.min_recommended_lkr - c.step_lkr)
                    else:
                        amt = c.min_recommended_lkr
                else:
                    if self.rng.random() < (self.temptation_bias - retry_bonus * 0.2):
                        amt = min(remaining, c.max_recommended_lkr)
                    else:
                        amt = 0
                amt = min(remaining, amt)
                allocations[c.id] = amt
                remaining -= amt

        elif interaction_type == "multi_period_saving":
            p_config = level.multi_period_config or {}
            raw_periods = p_config.get("periods", [])
            target_goal = p_config.get("target_goal_lkr", 5000)

            if isinstance(raw_periods, list) and raw_periods:
                n_weeks = len(raw_periods)
                for p_item in raw_periods:
                    p_num = p_item.get("period", 1) if isinstance(p_item, dict) else 1
                    allowance = p_item.get("allowance_lkr", 2000) if isinstance(p_item, dict) else 2000
                    p_resist = min(0.98, max(0.40, (self.theta_saving / 100.0) + retry_bonus * 0.45))
                    resisted = self.rng.random() < p_resist
                    if resisted:
                        needed_per_week = max(int(target_goal / n_weeks), int(allowance * 0.65))
                        saved = min(allowance, needed_per_week)
                    else:
                        saved = int(allowance * self.rng.uniform(0.10, 0.35))
                    weekly_decisions.append({
                        "period": p_num,
                        "saved_amount_lkr": saved,
                        "resisted_temptation": resisted,
                    })
            else:
                for p in range(1, 4):
                    resisted = self.rng.random() < (0.65 + retry_bonus * 0.3)
                    weekly_decisions.append({
                        "period": p,
                        "saved_amount_lkr": 1400 if resisted else 300,
                        "resisted_temptation": resisted,
                    })

        return {
            "selected_option_ids": selected_option_ids,
            "allocations": allocations,
            "weekly_decisions": weekly_decisions,
            "selected_rationale_id": selected_rationale_id,
        }

    def evolve_proficiency(self, passed: bool, overall_score: int):
        """Evolves latent proficiency based on experience and remediation."""
        delta = (self.learning_rate if passed else self.learning_rate * 0.8)
        if passed:
            self.theta_budgeting = min(99.0, self.theta_budgeting + delta * 0.8)
            self.theta_discipline = min(99.0, self.theta_discipline + delta * 0.8)
            self.theta_saving = min(99.0, self.theta_saving + delta * 0.8)
            self.theta_planning = min(99.0, self.theta_planning + delta * 0.8)
            self.temptation_bias = max(0.03, self.temptation_bias * 0.88)
        else:
            self.theta_budgeting = min(99.0, self.theta_budgeting + delta * 0.6)
            self.theta_discipline = min(99.0, self.theta_discipline + delta * 0.6)
            self.temptation_bias = max(0.04, self.temptation_bias * 0.94)


def generate_synthetic_dataset(seed: int = RANDOM_SEED) -> list[SyntheticGameplayRecord]:
    """
    Simulates 300 students to generate exactly 2,500 valid gameplay records.
    """
    rng = random.Random(seed)

    # 1. Distribute cohorts across the 3 missions
    # 105 puppy cohort, 98 squirrel cohort, 97 panda cohort = 300 total
    cohorts_distribution = ["puppy"] * 105 + ["squirrel"] * 98 + ["panda"] * 97
    rng.shuffle(cohorts_distribution)

    students: list[SimulatedStudent] = []
    student_counter = 1
    cohort_idx = 0

    for archetype, count in ARCHETYPE_COUNTS.items():
        for _ in range(count):
            stu_id = f"SYNTH_{student_counter:03d}"
            cohort = cohorts_distribution[cohort_idx]
            cohort_idx += 1
            students.append(SimulatedStudent(stu_id, archetype, cohort, rng))
            student_counter += 1

    rng.shuffle(students)

    # 2. Plan trajectory quota per student so total is EXACTLY 2,500
    base_quota = TOTAL_RECORDS // TOTAL_STUDENTS  # 2500 // 300 = 8
    remainder = TOTAL_RECORDS % TOTAL_STUDENTS    # 100 students get 9 attempts
    quotas = [base_quota] * TOTAL_STUDENTS
    for i in range(remainder):
        quotas[i] += 1

    student_quotas = {s.student_id: q for s, q in zip(students, quotas)}
    records_by_student: dict[str, list[dict[str, Any]]] = {s.student_id: [] for s in students}

    # 3. Simulate step-by-step
    for student in students:
        quota = student_quotas[student.student_id]
        while len(records_by_student[student.student_id]) < quota:
            m_id = student.get_active_mission_id()
            mission = get_mission(m_id)
            if not mission:
                break

            lvl = next((l for l in mission.levels if l.level_number == student.current_level_num), None)
            if not lvl:
                if student.active_mission_idx < len(student.missions_sequence) - 1:
                    student.active_mission_idx += 1
                    student.current_level_num = 1
                    student.current_attempt_num = 1
                    student.char_state = _default_char_state(student.get_active_mission_id())
                    continue
                else:
                    student.current_level_num = 1
                    student.current_attempt_num = 1
                    lvl = mission.levels[0]

            lagged = student.compute_lagged_features()

            student.current_time += timedelta(
                minutes=rng.randint(8, 45),
                seconds=rng.randint(0, 59),
            )
            sim_time_iso = student.current_time.isoformat()

            dec_inputs = student.generate_decision(lvl)
            decision_id = f"DEC_{student.student_id}_{student.step_index:04d}"

            fs, outcome, comp_eval, new_char_state, transition, mastery, rec = run_cdemf_pipeline(
                level=lvl,
                interaction_type=lvl.interaction_type,
                selected_option_ids=dec_inputs["selected_option_ids"],
                allocations=dec_inputs["allocations"],
                selected_rationale_id=dec_inputs["selected_rationale_id"],
                weekly_decisions=dec_inputs["weekly_decisions"],
                previous_char_state=student.char_state,
                decision_id=decision_id,
                current_level_number=student.current_level_num,
                consecutive_fails=lagged["hist_consecutive_fails"],
                budgeting_profile=int(lagged["hist_avg_budgeting_score"]),
                discipline_profile=int(lagged["hist_avg_spending_score"]),
                saving_profile=int(lagged["hist_avg_saving_score"]),
                mastery_level="Proficient" if lagged["hist_overall_score_avg"] >= 75 else "Developing",
                mission_id=m_id,
            )

            if dec_inputs["selected_option_ids"]:
                dec_summary = f"Options: {', '.join(dec_inputs['selected_option_ids'])}"
            elif dec_inputs["allocations"]:
                dec_summary = f"Allocations: {json.dumps(dec_inputs['allocations'])}"
            elif dec_inputs["weekly_decisions"]:
                dec_summary = f"Multi-period: {len(dec_inputs['weekly_decisions'])} weeks"
            else:
                dec_summary = "Default selection"

            passed = mastery.passed
            remediation_triggered = not passed

            rec_dict = {
                "synthetic_student_id": student.student_id,
                "attempt_id": f"ATT_{student.student_id}_M{student.active_mission_idx + 1}_L{student.current_level_num}_A{student.current_attempt_num}",
                "archetype": student.archetype,
                "step_index": student.step_index,
                "simulated_timestamp_iso": sim_time_iso,
                "mission_id": m_id,
                "level_number": student.current_level_num,
                "level_id": lvl.id,
                "interaction_type": lvl.interaction_type,
                "starting_budget_lkr": lvl.starting_budget_lkr,
                "attempt_number": student.current_attempt_num,
                "is_retry": student.current_attempt_num > 1,
                # Lagged predictors
                **lagged,
                # Decision details
                "decision_summary": dec_summary,
                "allocated_amount_lkr": fs.total_spent_lkr,
                "discretionary_spent_lkr": outcome.discretionary_spent_lkr,
                "reserve_preserved_lkr": outcome.reserve_preserved_lkr,
                # Outcomes
                "is_budget_feasible": fs.is_budget_feasible,
                "essential_needs_covered": outcome.essential_needs_covered,
                "score_budgeting": comp_eval.dimension_scores.budgeting_skill,
                "score_spending": comp_eval.dimension_scores.spending_discipline,
                "score_saving": comp_eval.dimension_scores.saving_behavior,
                "score_investment": comp_eval.dimension_scores.investment_awareness,
                "score_goal": comp_eval.dimension_scores.goal_achievement,
                "score_emergency_prep": comp_eval.secondary_scores.emergency_preparedness,
                "overall_score": mastery.overall_score,
                "passed": passed,
                "character_condition": new_char_state.physical_condition,
                "character_emotion": new_char_state.emotional_state,
                "transition_direction": transition.direction,
                "remediation_triggered": remediation_triggered,
                "_theta_avg": (student.theta_budgeting + student.theta_discipline + student.theta_saving + student.theta_planning) / 4.0,
            }

            records_by_student[student.student_id].append(rec_dict)
            student.history.append(rec_dict)
            student.step_index += 1
            student.char_state = new_char_state

            student.evolve_proficiency(passed, mastery.overall_score)

            if passed:
                student.current_level_num += 1
                student.current_attempt_num = 1
                if student.current_level_num > mission.total_levels:
                    student.active_mission_idx += 1
                    student.current_level_num = 1
                    student.char_state = _default_char_state(student.get_active_mission_id())
            else:
                student.current_attempt_num += 1

    # 4. Derive Forward-Looking Target Label (next_activity_support_need)
    all_final_records: list[SyntheticGameplayRecord] = []
    global_record_counter = 1

    for student_id, student_recs in records_by_student.items():
        n = len(student_recs)
        for i, rec_dict in enumerate(student_recs):
            if i < n - 1:
                next_rec = student_recs[i + 1]
                # Forward pedagogical observation for next activity:
                # 1. Foundation support needed if subsequent activity failed, had low score, or required multiple retries
                if not next_rec["passed"] or next_rec["overall_score"] < 75 or next_rec["attempt_number"] > 1:
                    label: SupportNeedLabel = "NEEDS_FOUNDATION_SUPPORT"
                # 2. Advanced extension challenge ready if subsequent activity cleared with high distinction
                # and student demonstrates sustained high latent proficiency without struggle
                elif (
                    next_rec["passed"]
                    and next_rec["overall_score"] >= 92
                    and next_rec["reserve_preserved_lkr"] > 0
                    and rec_dict["archetype"] in ("ADVANCED_ACHIEVER", "CAUTIOUS_IMPROVER")
                    and rec_dict["_theta_avg"] >= 84.0
                    and rec_dict["hist_retry_rate"] <= 0.15
                ):
                    label = "READY_FOR_ADVANCED"
                # 3. Standard level progression
                else:
                    label = "READY_FOR_STANDARD"
            else:
                # Terminal step evaluation
                theta = rec_dict["_theta_avg"]
                ov_score = rec_dict["overall_score"]
                if not rec_dict["passed"] or ov_score < 75 or theta < 65.0 or rec_dict["attempt_number"] > 1:
                    label = "NEEDS_FOUNDATION_SUPPORT"
                elif ov_score >= 92 and theta >= 85.0 and rec_dict["passed"] and rec_dict["archetype"] == "ADVANCED_ACHIEVER":
                    label = "READY_FOR_ADVANCED"
                else:
                    label = "READY_FOR_STANDARD"

            clean_dict = {k: v for k, v in rec_dict.items() if not k.startswith("_") and k != "score_emergency_prep"}
            clean_dict["record_id"] = f"SYNTH_REC_{global_record_counter:04d}"
            clean_dict["next_activity_support_need"] = label

            record_obj = SyntheticGameplayRecord(**clean_dict)
            all_final_records.append(record_obj)
            global_record_counter += 1

    assert len(all_final_records) == TOTAL_RECORDS, f"Expected {TOTAL_RECORDS}, got {len(all_final_records)}"
    return all_final_records


def write_dataset_files(records: list[SyntheticGameplayRecord]):
    """Writes the dataset in both CSV and JSONL formats."""
    CSV_DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)

    # 1. Write JSONL
    with open(JSONL_DATASET_PATH, "w", encoding="utf-8") as f:
        for r in records:
            f.write(r.model_dump_json() + "\n")

    # 2. Write CSV
    if records:
        fieldnames = list(records[0].model_dump().keys())
        with open(CSV_DATASET_PATH, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in records:
                writer.writerow(r.model_dump())

    print(f"Successfully generated {len(records)} records:")
    print(f" - CSV:   {CSV_DATASET_PATH}")
    print(f" - JSONL: {JSONL_DATASET_PATH}")


# Alias for module consistency
generate_dataset = generate_synthetic_dataset


if __name__ == "__main__":
    recs = generate_synthetic_dataset()
    write_dataset_files(recs)
