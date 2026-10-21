from fastapi import APIRouter, Query

from app.modules.tax_learning.content import lessons_for, quiz_for, scenarios_for
from app.modules.tax_learning.rules import RULES, public_rule
from app.modules.tax_learning.schemas import CalculateIn, QuizAnswerIn
from app.modules.tax_learning.service import grade_question, run_calculate

router = APIRouter(prefix="/api/tax", tags=["tax-learning"])


@router.get("/rules")
def list_rules():
    return {"rules": [public_rule(rule) for rule in RULES.values()]}


@router.get("/content")
def tax_content(lang: str = Query(default="en")):
    picked = "si" if lang.lower().startswith("si") else "en"
    return {
        "lang": picked,
        "lessons": lessons_for(picked),
        "scenarios": scenarios_for(picked),
        "quiz": quiz_for(picked),
        "disclaimer": {
            "en": "Practice only. Not tax advice. Official numbers are labelled with year and source.",
            "si": "අභ්‍යාසයි. බදු උපදෙස් නෙවෙයි. නිල රූප වර්ෂය සහ මූලාශ්‍රය සමඟ.",
        }[picked],
    }


@router.post("/calculate")
def tax_calculate(body: CalculateIn):
    return run_calculate(body.rule_id, body.income, body.income_kind, body.allow_expired)


@router.post("/quiz/grade")
def tax_quiz_grade(body: QuizAnswerIn):
    return grade_question(body.question_id, body.choice, body.amount)
