"""Deterministic project-gap identification tests."""
from app.domain.project_gaps import distinctive_keywords, identify_missing_projects

RECOMMENDED = ["Sales Dashboard", "Churn Prediction Report", "KPI Analytics Platform"]


def test_all_missing_when_unrelated_projects():
    current = [
        {"name": "Expense Splitter", "description": ""},
        {"name": "Chatbot", "description": "a chatbot"},
    ]
    assert identify_missing_projects(RECOMMENDED, current) == RECOMMENDED


def test_covered_project_is_excluded():
    current = [{"name": "Sales Dashboard", "description": "built with power bi"}]
    missing = identify_missing_projects(RECOMMENDED, current)
    assert "Sales Dashboard" not in missing
    assert missing == ["Churn Prediction Report", "KPI Analytics Platform"]


def test_match_via_distinctive_keyword_in_description():
    current = [{"name": "ML demo", "description": "a churn prediction model"}]
    missing = identify_missing_projects(RECOMMENDED, current)
    assert "Churn Prediction Report" not in missing


def test_distinctive_keywords_drops_generic_words():
    assert distinctive_keywords("KPI Analytics Platform") == ["kpi", "analytics"]
    # all-generic name falls back to its words
    assert distinctive_keywords("Web Platform") == ["web", "platform"]


def test_determinism():
    current = [{"name": "Portfolio", "description": "react site"}]
    assert identify_missing_projects(RECOMMENDED, current) == identify_missing_projects(
        RECOMMENDED, current
    )
