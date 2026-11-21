"""
BookReads Gamification — Streak ve Freeze Durum Makinesi
Hem simülatör hem backend aynı fonksiyonları kullanmalıdır (tek doğruluk kaynağı).

Sorumlu: Matematik Ekibi

Kurallar (özet):
  * Bir gün, o günkü toplam sayfa >= MIN_PAGES_FOR_STREAK ise "nitelikli"dir.
  * Nitelikli gün: streak +1.
  * Nitelikli olmayan gün (hiç okunmadı ya da yetersiz okundu):
      - streak == 0 ise bir şey olmaz,
      - streak > 0 ve freeze kredisi varsa 1 kredi harcanır, streak KORUNUR (artmaz),
      - streak > 0 ve kredi yoksa streak 0'a düşer.
  * Her takvim haftasının Pazartesi günü freeze kredisi `freeze_per_week` değerine
    SETLENİR (birikmez).
  * Günler sırayla işlenir. Backend için `settle_until` kaçırılan günleri
    sırayla yeniden oynatır; böylece simülatörle birebir aynı sonuç elde edilir.
"""
from dataclasses import dataclass
from datetime import date, timedelta
from typing import List, Optional, Tuple

MIN_PAGES_FOR_STREAK = 10

# (en az streak uzunluğu, yüzde bonus) — büyükten küçüğe
STREAK_TIERS = ((30, 25), (14, 15), (7, 10))


def streak_percent(streak: int) -> int:
    """Streak uzunluğuna göre taban XP üzerine eklenen yüzde bonus (0, 10, 15, 25)."""
    if streak < 0:
        raise ValueError("Streak negatif olamaz.")
    for min_len, pct in STREAK_TIERS:
        if streak >= min_len:
            return pct
    return 0


@dataclass(frozen=True)
class StreakState:
    """Kullanıcının streak durumu. `settled_through`: işlenmiş son gün (dahil)."""
    current_streak: int = 0
    longest_streak: int = 0
    freeze_credits: int = 1
    settled_through: Optional[date] = None


@dataclass(frozen=True)
class DayOutcome:
    """Bir günün işlenmesinin sonucu."""
    state: StreakState
    qualified: bool
    freeze_used: bool
    streak_broken: bool


def process_day(
    state: StreakState,
    day: date,
    qualified: bool,
    freeze_per_week: int = 1,
) -> DayOutcome:
    """
    Tek bir günü işler. Günler ardışık olmalıdır (settled_through + 1).
    `qualified`: o günün toplam sayfası >= MIN_PAGES_FOR_STREAK mi?
    """
    if freeze_per_week < 0:
        raise ValueError("Haftalık freeze kredisi negatif olamaz.")
    if state.settled_through is not None and day != state.settled_through + timedelta(days=1):
        raise ValueError("Günler sırayla işlenmelidir (settled_through + 1).")

    credits = freeze_per_week if day.weekday() == 0 else state.freeze_credits
    streak = state.current_streak
    longest = state.longest_streak
    freeze_used = False
    broken = False

    if qualified:
        streak += 1
        longest = max(longest, streak)
    elif streak > 0:
        if credits > 0:
            credits -= 1
            freeze_used = True
        else:
            streak = 0
            broken = True

    new_state = StreakState(
        current_streak=streak,
        longest_streak=longest,
        freeze_credits=credits,
        settled_through=day,
    )
    return DayOutcome(new_state, qualified, freeze_used, broken)


def settle_until(
    state: StreakState,
    today: date,
    freeze_per_week: int = 1,
) -> Tuple[StreakState, List[DayOutcome]]:
    """
    Backend için: `today`den ÖNCEKİ, işlenmemiş tüm günleri "nitelikli değil" olarak
    sırayla işler. Bugünün kendisi işlenmez (bugün henüz bitmedi).
    Hiç aktivite yoksa (settled_through None) durum değişmez.
    """
    outcomes: List[DayOutcome] = []
    if state.settled_through is None:
        return state, outcomes
    if today <= state.settled_through:
        if today < state.settled_through:
            raise ValueError("today, settled_through'dan önce olamaz.")
        return state, outcomes
    d = state.settled_through + timedelta(days=1)
    while d < today:
        outcome = process_day(state, d, False, freeze_per_week)
        state = outcome.state
        outcomes.append(outcome)
        d += timedelta(days=1)
    return state, outcomes
