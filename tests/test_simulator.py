"""
BookReads Simülatör Birim Testleri
Değişmezler, streak/freeze entegrasyonu, sayfa havuzuna bağlı kitap bitirme,
Monte Carlo motoru ve komut satırı arayüzü.
"""
import contextlib
import io
import random

import pytest

from gamification.simulator import (
    CASUAL_READER,
    HARDCORE_READER,
    REGULAR_READER,
    ReadingPersona,
    compare_personas,
    main,
    metrics_at,
    run_monte_carlo,
    simulate_user,
)
from gamification.xp_engine import calculate_book_completion_xp

ALL = [CASUAL_READER, REGULAR_READER, HARDCORE_READER]


def _perfect_reader(mean=20.0, target=15, book_pages=200):
    return ReadingPersona(
        name="Perfect", daily_pages_mean=mean, daily_pages_std=0.0, daily_target=target,
        skip_probability=0.0, avg_book_pages=book_pages,
        quiz_accuracy=0.8, quiz_questions_per_book=5,
    )


class TestInvariants:
    def test_runs_exact_number_of_days(self):
        res = simulate_user(REGULAR_READER, days=30, seed=42)
        assert res.total_days == 30 and len(res.daily_logs) == 30

    def test_cumulative_xp_and_level_never_decrease(self):
        res = simulate_user(HARDCORE_READER, days=60, seed=42)
        for prev, cur in zip(res.daily_logs, res.daily_logs[1:]):
            assert cur.cumulative_xp >= prev.cumulative_xp
            assert cur.level >= prev.level

    def test_total_xp_equals_sum_of_daily_xp(self):
        res = simulate_user(REGULAR_READER, days=20, seed=123)
        assert res.total_xp_earned == sum(d.total_day_xp for d in res.daily_logs)

    def test_daily_xp_equals_sum_of_components(self):
        res = simulate_user(HARDCORE_READER, days=40, seed=5)
        for d in res.daily_logs:
            assert d.total_day_xp == (d.base_xp + d.target_bonus + d.streak_multiplier_xp
                                      + d.book_completion_xp + d.quiz_xp)

    def test_days_read_plus_skipped_equals_total(self):
        res = simulate_user(CASUAL_READER, days=50, seed=99)
        assert res.days_read + res.days_skipped == 50

    def test_longest_streak_at_least_final_streak(self):
        res = simulate_user(CASUAL_READER, days=60, seed=42)
        assert res.longest_streak >= res.final_streak

    def test_daily_reading_xp_never_exceeds_bound(self):
        for persona in ALL:
            res = simulate_user(persona, days=90, seed=3)
            for d in res.daily_logs:
                assert d.base_xp + d.target_bonus + d.streak_multiplier_xp <= 265

    def test_global_random_state_is_untouched(self):
        random.seed(7)
        expected = random.random()
        random.seed(7)
        simulate_user(REGULAR_READER, days=30, seed=1)
        assert random.random() == expected


class TestStreakAndFreezeIntegration:
    @pytest.mark.parametrize("persona", ALL)
    @pytest.mark.parametrize("seed", range(10))
    def test_every_day_follows_streak_rules(self, persona, seed):
        res = simulate_user(persona, days=90, seed=seed)
        prev = 0
        for log in res.daily_logs:
            if log.qualified:
                assert log.streak == prev + 1 and not log.freeze_used
            elif prev > 0:
                # freeze kullanıldı (seri korunur) XOR seri sıfırlandı
                assert log.freeze_used != (log.streak == 0)
                assert log.streak_broken == (log.streak == 0)
                if log.freeze_used:
                    assert log.streak == prev
            else:
                assert log.streak == 0 and not log.freeze_used
            prev = log.streak

    @pytest.mark.parametrize("persona", ALL)
    def test_at_most_one_freeze_per_iso_week(self, persona):
        res = simulate_user(persona, days=90, seed=42)
        weeks = {}
        for log in res.daily_logs:
            if log.freeze_used:
                key = log.date.isocalendar()[:2]
                weeks[key] = weeks.get(key, 0) + 1
        assert all(v <= 1 for v in weeks.values())

    def test_under_10_pages_does_not_extend_streak(self):
        reader = _perfect_reader(mean=5.0)
        res = simulate_user(reader, days=10, seed=1)
        assert all(d.pages_read == 5 and not d.qualified for d in res.daily_logs)
        assert res.final_streak == 0 and res.longest_streak == 0
        assert res.freeze_uses == 0   # streak yokken freeze harcanmaz

    def test_no_freeze_means_streak_actually_resets(self):
        res = simulate_user(CASUAL_READER, days=60, seed=42, freeze_credits_per_week=0)
        assert res.freeze_uses == 0
        assert res.streak_breaks > 0
        assert any(log.streak_broken and log.streak == 0 for log in res.daily_logs)

    def test_no_skip_persona_maintains_long_streak(self):
        res = simulate_user(_perfect_reader(), days=30, seed=42)
        assert res.final_streak == 30 and res.longest_streak == 30
        assert res.freeze_uses == 0 and res.streak_breaks == 0

    def test_always_skip_persona_has_zero_xp(self):
        dormant = ReadingPersona(
            name="Dormant", daily_pages_mean=0.0, daily_pages_std=0.0, daily_target=10,
            skip_probability=1.0, avg_book_pages=200,
            quiz_accuracy=0.0, quiz_questions_per_book=0,
        )
        res = simulate_user(dormant, days=15, seed=42)
        assert res.total_xp_earned == 0 and res.final_level == 1
        assert res.final_streak == 0 and res.days_skipped == 15

    def test_streak_multiplier_boundaries(self):
        """20 sayfa/gün: taban 20 XP. Yüzde, günün streak değerine (bugün dahil) göre."""
        res = simulate_user(_perfect_reader(mean=20.0, target=0), days=30, seed=1)
        bonus = {d.day: d.streak_multiplier_xp for d in res.daily_logs}
        assert bonus[6] == 0     # streak 6  -> %0
        assert bonus[7] == 2     # streak 7  -> %10
        assert bonus[13] == 2
        assert bonus[14] == 3    # streak 14 -> %15
        assert bonus[29] == 3
        assert bonus[30] == 5    # streak 30 -> %25

    def test_lower_threshold_helps_casual_readers(self):
        a = run_monte_carlo(CASUAL_READER, horizons=(60,), runs=60, seed=1, min_pages_for_streak=10)
        b = run_monte_carlo(CASUAL_READER, horizons=(60,), runs=60, seed=1, min_pages_for_streak=5)
        assert b[60].metrics["longest_streak"].mean > a[60].metrics["longest_streak"].mean


class TestPageBasedBookCompletion:
    @pytest.mark.parametrize("persona", ALL)
    def test_books_completed_equals_pages_divided_by_book_size(self, persona):
        res = simulate_user(persona, days=60, seed=42)
        assert res.books_completed == res.total_pages_read // persona.avg_book_pages

    def test_no_books_if_pages_under_book_size(self):
        reader = _perfect_reader(mean=5.0, book_pages=1000)
        res = simulate_user(reader, days=10, seed=1)
        assert res.total_pages_read == 50 and res.books_completed == 0

    def test_book_xp_matches_engine(self):
        res = simulate_user(REGULAR_READER, days=60, seed=42)
        expected = res.books_completed * calculate_book_completion_xp(REGULAR_READER.avg_book_pages)
        assert sum(d.book_completion_xp for d in res.daily_logs) == expected

    def test_quiz_xp_is_binomial_not_truncated(self):
        """%100 doğruluk: kitap başına tam 5*5=25 XP; %0 doğruluk: 0 XP."""
        for accuracy, per_book in [(1.0, 25), (0.0, 0)]:
            reader = _perfect_reader(mean=100.0, book_pages=200)
            reader.quiz_accuracy = accuracy
            res = simulate_user(reader, days=10, seed=1)
            assert sum(d.quiz_xp for d in res.daily_logs) == res.books_completed * per_book


class TestPersonaComparisons:
    def test_hardcore_earns_more_xp_than_casual(self):
        r = compare_personas(days=60, seed=42)
        assert r["Kitap Kurdu (Hardcore)"].total_xp_earned > r["Az Okuyan (Casual)"].total_xp_earned

    def test_hardcore_reaches_higher_level_than_casual(self):
        r = compare_personas(days=90, seed=42)
        assert r["Kitap Kurdu (Hardcore)"].final_level > r["Az Okuyan (Casual)"].final_level

    def test_regular_reads_more_pages_than_casual(self):
        r = compare_personas(days=30, seed=42)
        assert r["Düzenli Okur (Regular)"].total_pages_read > r["Az Okuyan (Casual)"].total_pages_read

    def test_casual_skips_more_days_than_hardcore(self):
        r = compare_personas(days=90, seed=42)
        assert r["Az Okuyan (Casual)"].days_skipped > r["Kitap Kurdu (Hardcore)"].days_skipped

    def test_compare_personas_returns_all_three(self):
        r = compare_personas(days=10, seed=42)
        assert len(r) == 3
        assert {"Az Okuyan (Casual)", "Düzenli Okur (Regular)", "Kitap Kurdu (Hardcore)"} == set(r)


class TestMonteCarlo:
    def test_report_structure_and_ordering(self):
        reports = run_monte_carlo(REGULAR_READER, horizons=(30, 60), runs=100, seed=42)
        assert set(reports) == {30, 60}
        for day, rep in reports.items():
            assert rep.runs == 100 and rep.day == day
            for dist in rep.metrics.values():
                assert dist.min <= dist.p10 <= dist.median <= dist.p90 <= dist.max
                assert dist.std >= 0

    def test_longer_horizon_has_larger_cumulative_means(self):
        reports = run_monte_carlo(REGULAR_READER, horizons=(30, 60, 90), runs=100, seed=42)
        for metric in ("pages", "xp", "books", "freeze_uses"):
            means = [reports[h].metrics[metric].mean for h in (30, 60, 90)]
            assert means[0] < means[1] < means[2]

    def test_same_seed_same_result_and_different_seed_differs(self):
        a = run_monte_carlo(REGULAR_READER, horizons=(30,), runs=50, seed=7)
        b = run_monte_carlo(REGULAR_READER, horizons=(30,), runs=50, seed=7)
        c = run_monte_carlo(REGULAR_READER, horizons=(30,), runs=50, seed=8)
        assert a[30].metrics["xp"].mean == b[30].metrics["xp"].mean
        assert a[30].metrics["xp"].mean != c[30].metrics["xp"].mean

    def test_mean_pages_close_to_analytic_expectation(self):
        """E[sayfa] ≈ gün * (1 - skip) * mean (yuvarlama/kırpma payı ile %5 tolerans)."""
        rep = run_monte_carlo(REGULAR_READER, horizons=(90,), runs=200, seed=42)[90]
        expected = 90 * (1 - 0.10) * 25.0
        assert abs(rep.metrics["pages"].mean - expected) / expected < 0.05

    def test_prefix_consistency_with_single_run(self):
        res = simulate_user(REGULAR_READER, days=90, seed=3)
        assert metrics_at(res, 30)["pages"] == sum(d.pages_read for d in res.daily_logs[:30])

    def test_too_few_runs_raises(self):
        with pytest.raises(ValueError):
            run_monte_carlo(REGULAR_READER, runs=1)


class TestEdgeCasesAndCLI:
    def test_single_day_simulation(self):
        res = simulate_user(REGULAR_READER, days=1, seed=42)
        assert res.total_days == 1 and len(res.daily_logs) == 1

    def test_zero_days_raises_error(self):
        with pytest.raises(ValueError, match="Simülasyon süresi en az 1 gün olmalıdır"):
            simulate_user(REGULAR_READER, days=0)

    def test_deterministic_with_same_seed(self):
        a = simulate_user(REGULAR_READER, days=30, seed=12345)
        b = simulate_user(REGULAR_READER, days=30, seed=12345)
        assert (a.total_xp_earned, a.total_pages_read, a.final_level) == \
               (b.total_xp_earned, b.total_pages_read, b.final_level)

    def test_metrics_at_validates_day(self):
        res = simulate_user(REGULAR_READER, days=5, seed=1)
        with pytest.raises(ValueError):
            metrics_at(res, 6)

    def test_cli_runs_and_prints_tables(self):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            main(["--days", "10", "--runs", "5", "--seed", "1"])
        out = buf.getvalue()
        assert "Casual" in out and "Hardcore" in out and "Deterministik" in out

    def test_cli_markdown_output(self):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            main(["--all", "--runs", "5", "--markdown"])
        assert "| Metrik |" in buf.getvalue()
