"""
BookReads XP & Seviye Motoru Birim Testleri
Sınır değerler, oturum bölünmesinden bağımsızlık, streak yüzdesi, seviye formülü.
"""
import pytest

from gamification.streak import streak_percent
from gamification.xp_engine import (
    MAX_BOOK_COMPLETION_XP,
    calculate_book_completion_xp,
    calculate_level,
    calculate_quiz_xp,
    calculate_reading_xp,
    cumulative_base_xp_x10,
    daily_base_xp,
    daily_streak_bonus,
    level_threshold,
    marginal_level_cost,
)


def _reference_base_x10(pages: int) -> int:
    """Sayfa sayfa döngüyle yazılmış yavaş referans (kapalı formu doğrulamak için)."""
    total = 0
    for p in range(1, pages + 1):
        total += 10 if p <= 100 else 5 if p <= 250 else 1
        total = min(total, 2000)
    return total


class TestDailyBaseXP:
    """Azalan verimler: 100/101, 250/251, 500/501 sınırları."""

    @pytest.mark.parametrize("pages,expected", [
        (0, 0), (1, 1), (30, 30), (100, 100),
        (101, 100),   # 100.5 -> aşağı yuvarlanır
        (102, 101), (250, 175),
        (251, 175),   # 175.1 -> 175
        (260, 176), (499, 199), (500, 200), (501, 200), (1000, 200),
    ])
    def test_boundaries(self, pages, expected):
        assert daily_base_xp(pages) == expected

    def test_closed_form_matches_page_by_page_reference(self):
        for pages in range(0, 801):
            assert cumulative_base_xp_x10(pages) == _reference_base_x10(pages)

    def test_monotonic_non_decreasing(self):
        prev = 0
        for pages in range(0, 700):
            cur = daily_base_xp(pages)
            assert cur >= prev
            prev = cur

    def test_negative_pages_raises(self):
        with pytest.raises(ValueError, match="negatif olamaz"):
            daily_base_xp(-1)
        with pytest.raises(ValueError, match="negatif olamaz"):
            calculate_reading_xp(pages_read=-5)


class TestReadingSession:
    def test_standard_session_under_100_pages(self):
        r = calculate_reading_xp(pages_read=30)
        assert r["base_xp"] == 30
        assert r["target_bonus_xp"] == 0
        assert r["streak_multiplier_xp"] == 0
        assert r["base_plus_target_xp"] == 30
        assert r["reading_total_xp"] == 30

    def test_zero_pages_gives_zero(self):
        r = calculate_reading_xp(pages_read=0, daily_target=10, streak_before=40)
        assert r["reading_total_xp"] == 0
        assert r["is_target_completed"] is False

    def test_target_bonus_awarded_on_crossing(self):
        r = calculate_reading_xp(pages_read=25, daily_target=20)
        assert r["target_bonus_xp"] == 15
        assert r["is_target_completed"] is True

    def test_target_bonus_not_awarded_twice(self):
        r = calculate_reading_xp(pages_read=10, daily_target=20, already_read_today=20)
        assert r["target_bonus_xp"] == 0
        assert r["is_target_completed"] is False

    def test_target_bonus_awarded_in_second_session(self):
        first = calculate_reading_xp(pages_read=12, daily_target=20, already_read_today=0)
        second = calculate_reading_xp(pages_read=12, daily_target=20, already_read_today=12)
        assert first["target_bonus_xp"] == 0
        assert second["target_bonus_xp"] == 15

    def test_target_zero_disables_bonus(self):
        assert calculate_reading_xp(pages_read=500, daily_target=0)["target_bonus_xp"] == 0

    def test_tier_crossing_inside_one_session(self):
        # 90 sayfa okunmuş, 20 sayfa daha: 10 sayfa %100 + 10 sayfa %50 = 15 XP
        r = calculate_reading_xp(pages_read=20, already_read_today=90)
        assert r["base_xp"] == 15

    def test_cap_applies_across_sessions(self):
        r = calculate_reading_xp(pages_read=100, already_read_today=450)
        # 450 -> 550 sayfa: toplam taban 199 -> 200 (tavan)
        assert r["base_xp"] == daily_base_xp(550) - daily_base_xp(450)
        assert daily_base_xp(550) == 200


class TestStreakBonus:
    @pytest.mark.parametrize("streak,pct", [
        (0, 0), (6, 0), (7, 10), (13, 10), (14, 15), (29, 15), (30, 25), (100, 25),
    ])
    def test_streak_percent_tiers(self, streak, pct):
        assert streak_percent(streak) == pct

    def test_negative_streak_raises(self):
        with pytest.raises(ValueError):
            streak_percent(-1)

    def test_contract_example_53_xp(self):
        """Sözleşme örneği: 35 sayfa, hedef 20, streak_before=7 -> 53 XP."""
        r = calculate_reading_xp(pages_read=35, daily_target=20, streak_before=7)
        assert r["base_xp"] == 35
        assert r["target_bonus_xp"] == 15
        assert r["streak_multiplier_xp"] == 3          # 35 * 10 // 100
        assert r["reading_total_xp"] == 53

    def test_today_counts_when_it_qualifies(self):
        # streak_before=6: 10 sayfa okursa bugün 7. gün olur -> %10
        assert daily_streak_bonus(40, streak_before=6) == 4
        # 9 sayfa nitelikli değil -> bugün 7. gün sayılmaz -> %0
        assert daily_streak_bonus(9, streak_before=6) == 0

    def test_tier_boundaries_use_streak_including_today(self):
        assert daily_streak_bonus(100, streak_before=12) == 10   # bugün 13 -> %10
        assert daily_streak_bonus(100, streak_before=13) == 15   # bugün 14 -> %15
        assert daily_streak_bonus(100, streak_before=28) == 15   # bugün 29 -> %15
        assert daily_streak_bonus(100, streak_before=29) == 25   # bugün 30 -> %25

    def test_integer_floor_not_banker_rounding(self):
        # 15 sayfa * %10 = 1.5 -> 1 (round() 2 verirdi; tam sayı bölmesi her dilde 1 verir)
        assert daily_streak_bonus(15, streak_before=6) == 1

    def test_max_daily_reading_xp_is_bounded(self):
        r = calculate_reading_xp(pages_read=10_000, daily_target=10, streak_before=500)
        assert r["reading_total_xp"] == 200 + 15 + 50


class TestSessionSplitIndependence:
    """Günlük toplam XP, sayfaların kaç oturuma bölündüğünden bağımsız olmalıdır."""

    @pytest.mark.parametrize("splits", [
        [35], [1] * 35, [10, 25], [9, 1, 25], [7] * 5, [60, 60, 60, 60],
        [100, 1, 149, 1, 1, 300], [250, 250], [1] * 120,
    ])
    @pytest.mark.parametrize("streak_before", [0, 6, 13, 29])
    @pytest.mark.parametrize("target", [0, 20, 150])
    def test_sum_of_sessions_equals_single_session(self, splits, streak_before, target):
        totals = {"base_xp": 0, "target_bonus_xp": 0, "streak_multiplier_xp": 0}
        already = 0
        for pages in splits:
            r = calculate_reading_xp(pages, target, already, streak_before)
            for key in totals:
                assert r[key] >= 0
                totals[key] += r[key]
            already += pages
        single = calculate_reading_xp(sum(splits), target, 0, streak_before)
        for key in totals:
            assert totals[key] == single[key]


class TestBookAndQuiz:
    def test_book_completion_standard(self):
        assert calculate_book_completion_xp(300) == 60

    def test_book_completion_uses_integer_division(self):
        assert calculate_book_completion_xp(123) == 24   # 24.6 -> 24

    def test_book_completion_cap(self):
        assert calculate_book_completion_xp(2000) == MAX_BOOK_COMPLETION_XP == 200
        assert calculate_book_completion_xp(1000) == 200
        assert calculate_book_completion_xp(999) == 199

    def test_book_completion_custom_cap(self):
        assert calculate_book_completion_xp(300, max_bonus=50) == 50

    def test_book_completion_invalid_pages(self):
        with pytest.raises(ValueError):
            calculate_book_completion_xp(0)

    def test_quiz_xp(self):
        assert calculate_quiz_xp(3, 5) == 15
        assert calculate_quiz_xp(0, 5) == 0

    def test_quiz_invalid_inputs(self):
        with pytest.raises(ValueError):
            calculate_quiz_xp(6, 5)
        with pytest.raises(ValueError):
            calculate_quiz_xp(-1, 5)


class TestLevelProgression:
    def test_initial_level(self):
        assert calculate_level(0) == (1, 100, 100, 0.0)

    def test_level_two_boundary(self):
        assert calculate_level(99)[0] == 1
        assert calculate_level(100) == (2, 400, 300, 0.0)

    def test_mid_level_progress(self):
        assert calculate_level(250) == (2, 400, 150, 50.0)

    def test_contract_example_1450_xp(self):
        level, nxt, needed, progress = calculate_level(1450)
        assert (level, nxt, needed, progress) == (4, 1600, 150, 78.57)

    def test_level_9_to_10(self):
        assert calculate_level(8099)[0] == 9
        assert calculate_level(8100)[0] == 10
        assert marginal_level_cost(9) == 1700
        assert level_threshold(10) - level_threshold(9) == 1700

    def test_level_10_to_11_cost_is_1900(self):
        assert marginal_level_cost(10) == 1900
        assert level_threshold(11) - level_threshold(10) == 1900

    def test_high_level(self):
        assert calculate_level(10_000) == (11, 12_100, 2_100, 0.0)

    def test_thresholds_are_consistent_with_level_function(self):
        for xp in range(0, 25_000, 37):
            level, nxt, needed, progress = calculate_level(xp)
            assert level_threshold(level) <= xp < level_threshold(level + 1)
            assert nxt == level_threshold(level + 1)
            assert needed == nxt - xp
            assert 0.0 <= progress < 100.0

    def test_marginal_cost_matches_threshold_difference(self):
        for level in range(1, 200):
            assert marginal_level_cost(level) == level_threshold(level + 1) - level_threshold(level)

    def test_negative_xp_raises(self):
        with pytest.raises(ValueError):
            calculate_level(-10)
