"""Deterministic Career Simulator tests (invariants over fixed inputs)."""
from app.domain.scoring import ResumeQualitySignals, ScoringInput, compute_hiring_score
from app.domain.simulator import candidate_actions, simulate, whatif


def _base_input():
    return ScoringInput(
        role_key="data_analyst",
        skills=["SQL"],
        technologies=[],
        projects=[],
        certifications=[],
        github_strength_score=0,
        resume_quality=ResumeQualitySignals(has_skills=True, word_count=120),
    )


def test_base_score_matches_engine():
    inp = _base_input()
    result = simulate(inp)
    assert result.base_score == compute_hiring_score(inp).hiring_score


def test_scenarios_sorted_and_nonnegative():
    result = simulate(_base_input())
    assert result.scenarios, "should produce what-if scenarios"
    deltas = [s.delta for s in result.scenarios]
    assert deltas == sorted(deltas, reverse=True)
    assert all(s.delta >= 0 for s in result.scenarios)
    assert all(s.projected_score >= result.base_score for s in result.scenarios)


def test_roadmap_monotonic_and_final():
    result = simulate(_base_input())
    scores = [step.projected_score for step in result.roadmap]
    assert scores == sorted(scores)  # non-decreasing
    expected_final = result.roadmap[-1].projected_score if result.roadmap else result.base_score
    assert result.roadmap_final_score == expected_final
    assert result.roadmap_final_score >= result.base_score


def test_determinism():
    a = simulate(_base_input())
    b = simulate(_base_input())
    assert a.base_score == b.base_score
    assert [s.projected_score for s in a.scenarios] == [s.projected_score for s in b.scenarios]
    assert [r.label for r in a.roadmap] == [r.label for r in b.roadmap]


def test_whatif_empty_equals_base():
    r = whatif(_base_input(), [])
    assert r["projected_score"] == r["base_score"]
    assert r["delta"] == 0


def test_whatif_single_action_matches_its_delta():
    inp = _base_input()
    actions = candidate_actions(inp)
    assert actions, "should expose candidate actions"
    top = actions[0]
    r = whatif(inp, [top.id])
    assert r["delta"] == top.delta
    assert r["projected_score"] == r["base_score"] + top.delta


def test_whatif_combination_is_deterministic_and_monotonic():
    inp = _base_input()
    ids = [a.id for a in candidate_actions(inp)[:3]]
    first = whatif(inp, ids)
    assert first == whatif(inp, ids)
    # combining positive actions never lowers the score below base
    assert first["projected_score"] >= first["base_score"]
