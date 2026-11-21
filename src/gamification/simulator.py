"""
BookReads Gamification — Kullanıcı Simülatörü ve Monte Carlo Motoru

Farklı okuma personalarını gün gün simüle ederek XP, seviye, kitap ve streak
sonuçlarını raporlar. Streak/freeze kuralları `streak.py`, XP kuralları
`xp_engine.py` modülündedir; simülatör yalnızca davranışı (rastgele okuma) üretir.

Komut satırı:
    PYTHONPATH=src python3 -m gamification.simulator --all
    PYTHONPATH=src python3 -m gamification.simulator --all --markdown
    PYTHONPATH=src python3 -m gamification.simulator --days 60 --runs 500 --seed 7
    PYTHONPATH=src python3 -m gamification.simulator --all --min-pages 5

Sorumlu: Matematik Ekibi
"""
import argparse
import random
import statistics
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Dict, List, Optional, Sequence, Tuple

from gamification.streak import MIN_PAGES_FOR_STREAK, StreakState, process_day
from gamification.xp_engine import (
    calculate_book_completion_xp,
    calculate_level,
    calculate_quiz_xp,
    calculate_reading_xp,
)


# ─── Veri Modelleri ───────────────────────────────────────────────
@dataclass
class ReadingPersona:
    """Bir kullanıcı arketipinin günlük okuma davranışını tanımlar."""
    name: str
    daily_pages_mean: float       # okunan günlerde ortalama sayfa
    daily_pages_std: float        # standart sapma
    daily_target: int             # kullanıcının günlük hedefi
    skip_probability: float       # günü tamamen atlama olasılığı
    avg_book_pages: int           # ortalama kitap uzunluğu
    quiz_accuracy: float          # her sorunun doğru olma olasılığı
    quiz_questions_per_book: int  # kitap başına quiz sorusu


CASUAL_READER = ReadingPersona(
    name="Az Okuyan (Casual)",
    daily_pages_mean=10.0, daily_pages_std=5.0, daily_target=10,
    skip_probability=0.30, avg_book_pages=200,
    quiz_accuracy=0.60, quiz_questions_per_book=5,
)
REGULAR_READER = ReadingPersona(
    name="Düzenli Okur (Regular)",
    daily_pages_mean=25.0, daily_pages_std=8.0, daily_target=20,
    skip_probability=0.10, avg_book_pages=280,
    quiz_accuracy=0.70, quiz_questions_per_book=5,
)
HARDCORE_READER = ReadingPersona(
    name="Kitap Kurdu (Hardcore)",
    daily_pages_mean=55.0, daily_pages_std=15.0, daily_target=40,
    skip_probability=0.03, avg_book_pages=350,
    quiz_accuracy=0.85, quiz_questions_per_book=10,
)
ALL_PERSONAS = [CASUAL_READER, REGULAR_READER, HARDCORE_READER]


@dataclass
class DayLog:
    """Simülasyonun tek bir gününe ait kayıt (kümülatif alanlar o güne kadardır)."""
    day: int
    date: date
    pages_read: int
    qualified: bool
    base_xp: int
    target_bonus: int
    streak_multiplier_xp: int
    book_completion_xp: int
    quiz_xp: int
    total_day_xp: int
    cumulative_xp: int
    level: int
    streak: int
    longest_streak: int
    freeze_used: bool
    streak_broken: bool
    cumulative_pages: int
    cumulative_books: int
    cumulative_freezes: int
    cumulative_breaks: int
    cumulative_days_read: int
    cumulative_qualified_days: int


@dataclass
class SimulationResult:
    """Bir simülasyon koşusunun özeti."""
    persona_name: str
    total_days: int
    total_pages_read: int
    total_xp_earned: int
    final_level: int
    final_streak: int
    longest_streak: int
    books_completed: int
    freeze_uses: int
    streak_breaks: int
    days_read: int
    days_skipped: int
    daily_logs: List[DayLog] = field(default_factory=list)


# ─── Tekil Simülatör ──────────────────────────────────────────────
def simulate_user(
    persona: ReadingPersona,
    days: int = 30,
    start_date: Optional[date] = None,
    seed: Optional[int] = None,
    freeze_credits_per_week: int = 1,
    min_pages_for_streak: int = MIN_PAGES_FOR_STREAK,
    rng: Optional[random.Random] = None,
) -> SimulationResult:
    """Verilen personanın okuma davranışını gün gün simüle eder (global RNG'ye dokunmaz)."""
    if days <= 0:
        raise ValueError("Simülasyon süresi en az 1 gün olmalıdır.")
    if rng is None:
        rng = random.Random(seed)
    if start_date is None:
        start_date = date(2026, 1, 1)  # Perşembe

    state = StreakState(freeze_credits=freeze_credits_per_week)
    cumulative_xp = 0
    total_pages = 0
    books_completed = 0
    freeze_uses = 0
    streak_breaks = 0
    days_read = 0
    days_skipped = 0
    qualified_days = 0
    book_pool = 0
    logs: List[DayLog] = []

    for day_num in range(1, days + 1):
        current_date = start_date + timedelta(days=day_num - 1)

        # 1. Bugün ne kadar okundu?
        if rng.random() < persona.skip_probability:
            pages_today = 0
            days_skipped += 1
        else:
            pages_today = max(1, int(round(rng.gauss(
                persona.daily_pages_mean, persona.daily_pages_std))))
            days_read += 1
            total_pages += pages_today

        # 2. Okuma XP'si (streak_before: bugünden önceki streak)
        xp = calculate_reading_xp(
            pages_read=pages_today,
            daily_target=persona.daily_target,
            already_read_today=0,
            streak_before=state.current_streak,
            min_pages=min_pages_for_streak,
        )

        # 3. Streak / freeze
        qualified = pages_today >= min_pages_for_streak
        outcome = process_day(state, current_date, qualified, freeze_credits_per_week)
        state = outcome.state
        if qualified:
            qualified_days += 1
        if outcome.freeze_used:
            freeze_uses += 1
        if outcome.streak_broken:
            streak_breaks += 1

        # 4. Kitap bitirme (sayfa havuzuna bağlı) ve binomial quiz
        book_xp = 0
        quiz_xp = 0
        if pages_today > 0 and persona.avg_book_pages > 0:
            book_pool += pages_today
            while book_pool >= persona.avg_book_pages:
                books_completed += 1
                book_pool -= persona.avg_book_pages
                book_xp += calculate_book_completion_xp(persona.avg_book_pages)
                correct = sum(
                    1 for _ in range(persona.quiz_questions_per_book)
                    if rng.random() < persona.quiz_accuracy
                )
                quiz_xp += calculate_quiz_xp(correct, persona.quiz_questions_per_book)

        total_day_xp = xp["reading_total_xp"] + book_xp + quiz_xp
        cumulative_xp += total_day_xp
        level = calculate_level(cumulative_xp)[0]

        logs.append(DayLog(
            day=day_num, date=current_date, pages_read=pages_today, qualified=qualified,
            base_xp=xp["base_xp"], target_bonus=xp["target_bonus_xp"],
            streak_multiplier_xp=xp["streak_multiplier_xp"],
            book_completion_xp=book_xp, quiz_xp=quiz_xp,
            total_day_xp=total_day_xp, cumulative_xp=cumulative_xp, level=level,
            streak=state.current_streak, longest_streak=state.longest_streak,
            freeze_used=outcome.freeze_used, streak_broken=outcome.streak_broken,
            cumulative_pages=total_pages, cumulative_books=books_completed,
            cumulative_freezes=freeze_uses, cumulative_breaks=streak_breaks,
            cumulative_days_read=days_read, cumulative_qualified_days=qualified_days,
        ))

    return SimulationResult(
        persona_name=persona.name, total_days=days, total_pages_read=total_pages,
        total_xp_earned=cumulative_xp, final_level=logs[-1].level,
        final_streak=state.current_streak, longest_streak=state.longest_streak,
        books_completed=books_completed, freeze_uses=freeze_uses,
        streak_breaks=streak_breaks, days_read=days_read, days_skipped=days_skipped,
        daily_logs=logs,
    )


METRIC_NAMES = (
    "pages", "xp", "level", "longest_streak",
    "freeze_uses", "books", "streak_breaks", "qualified_days",
)


def metrics_at(result: SimulationResult, day: int) -> Dict[str, int]:
    """Bir koşunun `day`. günün sonundaki metrikleri (ön ek tutarlılığı sağlar)."""
    if not 1 <= day <= result.total_days:
        raise ValueError("day, simülasyon süresi içinde olmalıdır.")
    log = result.daily_logs[day - 1]
    return {
        "pages": log.cumulative_pages,
        "xp": log.cumulative_xp,
        "level": log.level,
        "longest_streak": log.longest_streak,
        "freeze_uses": log.cumulative_freezes,
        "books": log.cumulative_books,
        "streak_breaks": log.cumulative_breaks,
        "qualified_days": log.cumulative_qualified_days,
    }


# ─── Monte Carlo ──────────────────────────────────────────────────
@dataclass
class MetricDistribution:
    mean: float
    std: float
    median: float
    p10: float
    p90: float
    min: float
    max: float


@dataclass
class MonteCarloReport:
    """Bir persona için, `day`. gün itibarıyla N koşunun dağılımları."""
    persona_name: str
    runs: int
    day: int
    metrics: Dict[str, MetricDistribution]


def _summarize(values: Sequence[float]) -> MetricDistribution:
    if len(values) < 2:
        raise ValueError("Dağılım özeti için en az 2 koşu gerekir.")
    deciles = statistics.quantiles(values, n=10)  # 9 kesim noktası: P10 ... P90
    return MetricDistribution(
        mean=statistics.mean(values), std=statistics.stdev(values),
        median=statistics.median(values), p10=deciles[0], p90=deciles[-1],
        min=min(values), max=max(values),
    )


def run_monte_carlo(
    persona: ReadingPersona,
    horizons: Sequence[int] = (30, 60, 90),
    runs: int = 1000,
    seed: int = 42,
    freeze_credits_per_week: int = 1,
    min_pages_for_streak: int = MIN_PAGES_FOR_STREAK,
) -> Dict[int, MonteCarloReport]:
    """
    Her koşu en uzun ufuk kadar simüle edilir; daha kısa ufuklar aynı koşunun
    ön eki olarak okunur (30/60/90 günlük tablolar birbiriyle tutarlıdır).
    """
    if runs < 2:
        raise ValueError("En az 2 koşu gerekir.")
    horizons = sorted(set(horizons))
    master = random.Random(seed)
    samples: Dict[int, Dict[str, List[float]]] = {
        h: {m: [] for m in METRIC_NAMES} for h in horizons
    }
    for _ in range(runs):
        res = simulate_user(
            persona, days=horizons[-1], rng=random.Random(master.randrange(2**31)),
            freeze_credits_per_week=freeze_credits_per_week,
            min_pages_for_streak=min_pages_for_streak,
        )
        for h in horizons:
            for name, value in metrics_at(res, h).items():
                samples[h][name].append(float(value))
    return {
        h: MonteCarloReport(
            persona_name=persona.name, runs=runs, day=h,
            metrics={m: _summarize(samples[h][m]) for m in METRIC_NAMES},
        )
        for h in horizons
    }


def run_all_monte_carlo(
    horizons: Sequence[int] = (30, 60, 90),
    runs: int = 1000,
    seed: int = 42,
    freeze_credits_per_week: int = 1,
    min_pages_for_streak: int = MIN_PAGES_FOR_STREAK,
) -> Dict[str, Dict[int, MonteCarloReport]]:
    return {
        p.name: run_monte_carlo(p, horizons, runs, seed,
                                freeze_credits_per_week, min_pages_for_streak)
        for p in ALL_PERSONAS
    }


def compare_personas(
    days: int = 90,
    seed: int = 42,
    freeze_credits_per_week: int = 1,
    min_pages_for_streak: int = MIN_PAGES_FOR_STREAK,
) -> Dict[str, SimulationResult]:
    """Üç personayı tek (deterministik) koşuyla simüle eder; her persona kendi alt tohumunu alır."""
    master = random.Random(seed)
    results = {}
    for persona in ALL_PERSONAS:
        results[persona.name] = simulate_user(
            persona, days=days, seed=master.randrange(2**31),
            freeze_credits_per_week=freeze_credits_per_week,
            min_pages_for_streak=min_pages_for_streak,
        )
    return results


# ─── Çıktı biçimlendirme (Türkçe sayı biçimi: 1.234,5) ────────────
def _tr(x: float, nd: int = 0) -> str:
    s = f"{x:,.{nd}f}"
    return s.replace(",", "§").replace(".", ",").replace("§", ".")


def _pm(d: MetricDistribution, nd: int = 0) -> str:
    return f"{_tr(d.mean, nd)} ± {_tr(d.std, nd)}"


def _render(title: str, header: Sequence[str], rows: List[Tuple[str, List[str]]],
            markdown: bool) -> str:
    out = [("#### " if markdown else "") + title]
    if markdown:
        out.append("| " + " | ".join(header) + " |")
        out.append("|" + "---|" * len(header))
        for label, vals in rows:
            out.append("| " + " | ".join([f"**{label}**"] + vals) + " |")
    else:
        widths = [34] + [24] * (len(header) - 1)
        line = " | ".join(h.ljust(w) if i == 0 else h.rjust(w)
                          for i, (h, w) in enumerate(zip(header, widths)))
        out.append("-" * len(line))
        out.append(line)
        out.append("-" * len(line))
        for label, vals in rows:
            cells = [label.ljust(widths[0])] + [v.rjust(w) for v, w in zip(vals, widths[1:])]
            out.append(" | ".join(cells))
        out.append("-" * len(line))
    return "\n".join(out)


_SHORT = ["Casual", "Regular", "Hardcore"]


def format_reference_table(results: Dict[str, SimulationResult], day: int,
                           markdown: bool = False) -> str:
    rs = list(results.values())
    m = [metrics_at(r, day) for r in rs]
    dr = [r.daily_logs[day - 1].cumulative_days_read for r in rs]
    rows = [
        ("Toplam Okunan Sayfa", [_tr(x["pages"]) for x in m]),
        ("Toplam Kazanılan XP", [_tr(x["xp"]) for x in m]),
        ("Ulaşılan Seviye", [f"Level {x['level']}" for x in m]),
        ("Bitirilen Kitap", [str(x["books"]) for x in m]),
        ("En Uzun Streak (gün)", [str(x["longest_streak"]) for x in m]),
        ("Kullanılan Freeze", [str(x["freeze_uses"]) for x in m]),
        ("Kırılan Streak (sıfırlanma)", [str(x["streak_breaks"]) for x in m]),
        ("Okunan / Atlanan Gün", [f"{a} / {day - a}" for a in dr]),
    ]
    return _render(f"Deterministik referans koşusu — {day}. gün",
                   ["Metrik"] + _SHORT, rows, markdown)


def format_monte_carlo_table(reports: Dict[str, Dict[int, MonteCarloReport]], day: int,
                             markdown: bool = False) -> str:
    rep = [reports[name][day] for name in reports]
    runs = rep[0].runs
    rows = [
        ("Toplam Okunan Sayfa", [_pm(r.metrics["pages"]) for r in rep]),
        ("Toplam Kazanılan XP", [_pm(r.metrics["xp"]) for r in rep]),
        ("Seviye: medyan (P10–P90)", [
            f"{_tr(r.metrics['level'].median)} ({_tr(r.metrics['level'].p10)}–"
            f"{_tr(r.metrics['level'].p90)})" for r in rep]),
        ("Bitirilen Kitap", [_pm(r.metrics["books"], 1) for r in rep]),
        ("En Uzun Streak (gün)", [_pm(r.metrics["longest_streak"], 1) for r in rep]),
        ("Kullanılan Freeze", [_pm(r.metrics["freeze_uses"], 1) for r in rep]),
        ("Kırılan Streak (sıfırlanma)", [_pm(r.metrics["streak_breaks"], 1) for r in rep]),
        ("Nitelikli Gün (≥ eşik)", [_pm(r.metrics["qualified_days"], 1) for r in rep]),
    ]
    return _render(f"{_tr(runs)} koşu, {day}. gün — ortalama ± standart sapma",
                   ["Metrik"] + _SHORT, rows, markdown)


# ─── Komut satırı ─────────────────────────────────────────────────
def main(argv: Optional[Sequence[str]] = None) -> None:
    parser = argparse.ArgumentParser(
        description="BookReads gamification simülatörü (deterministik + Monte Carlo)")
    parser.add_argument("--days", type=int, default=90, help="tek ufuk (gün); --all ile 30/60/90")
    parser.add_argument("--all", action="store_true", help="30, 60 ve 90 günlük tabloları üret")
    parser.add_argument("--runs", type=int, default=1000, help="Monte Carlo koşu sayısı")
    parser.add_argument("--seed", type=int, default=42, help="ana tohum")
    parser.add_argument("--min-pages", type=int, default=MIN_PAGES_FOR_STREAK,
                        help="streak için günlük asgari sayfa")
    parser.add_argument("--freeze-per-week", type=int, default=1, help="haftalık freeze kredisi")
    parser.add_argument("--markdown", action="store_true", help="Markdown tablo çıktısı")
    args = parser.parse_args(argv)

    horizons = (30, 60, 90) if args.all else (args.days,)
    ref = compare_personas(days=horizons[-1], seed=args.seed,
                           freeze_credits_per_week=args.freeze_per_week,
                           min_pages_for_streak=args.min_pages)
    mc = run_all_monte_carlo(horizons, args.runs, args.seed,
                             args.freeze_per_week, args.min_pages)

    print(f"# Parametreler: seed={args.seed}, runs={args.runs}, "
          f"min_pages={args.min_pages}, freeze_per_week={args.freeze_per_week}, "
          f"horizons={list(horizons)}")
    for h in horizons:
        print()
        print(format_monte_carlo_table(mc, h, args.markdown))
    for h in horizons:
        print()
        print(format_reference_table(ref, h, args.markdown))


if __name__ == "__main__":
    main()
