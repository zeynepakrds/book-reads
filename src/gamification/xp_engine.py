"""
BookReads Gamification Motoru — XP, Seviye ve Anti-Spam Hesaplayıcı
Sorumlu: Matematik Ekibi

Tasarım ilkeleri:
  1. Tüm hesaplar TAM SAYI aritmetiğiyle yapılır (float / banker's rounding yok).
  2. Günlük XP, günün TOPLAM sayfasının bir fonksiyonudur; oturumlar bu
     kümülatif fonksiyonun farkı olarak hesaplanır. Böylece kullanıcı sayfalarını
     kaç parçaya bölerse bölsün günlük toplam XP değişmez.
  3. Streak çarpanı yalnızca taban XP'ye uygulanır; günün yüzdesi, günün
     streak değerine (bugün nitelikli olduysa dahil) göre belirlenir.
"""
import math
from typing import Dict, Tuple

from gamification.streak import MIN_PAGES_FOR_STREAK, streak_percent

DAILY_BASE_XP_CAP = 200          # günlük taban XP tavanı
TARGET_BONUS_XP = 15             # günlük hedef bonusu
MAX_BOOK_COMPLETION_XP = 200     # kitap başına bitirme bonusu tavanı
BOOK_COMPLETION_PERCENT = 20     # kitap sayfasının %20'si
QUIZ_XP_PER_CORRECT = 5          # doğru cevap başına XP

TIER1_END = 100                  # 1-100. sayfa: 1.0 XP
TIER2_END = 250                  # 101-250. sayfa: 0.5 XP, 251+: 0.1 XP


# ─── Günlük taban XP (kapalı form, onda bir XP biriminde) ─────────
def cumulative_base_xp_x10(pages_today: int) -> int:
    """
    Günün toplam `pages_today` sayfası için kümülatif taban XP'nin 10 katı.
        s <= 100        : 10 s
        100 < s <= 250  : 1000 + 5 (s - 100)
        s > 250         : 1750 + (s - 250)
    ve en fazla 2000 (= 200 XP).
    """
    if pages_today < 0:
        raise ValueError("Okunan sayfa sayısı negatif olamaz.")
    if pages_today <= TIER1_END:
        value = 10 * pages_today
    elif pages_today <= TIER2_END:
        value = 1000 + 5 * (pages_today - TIER1_END)
    else:
        value = 1750 + (pages_today - TIER2_END)
    return min(value, DAILY_BASE_XP_CAP * 10)


def daily_base_xp(pages_today: int) -> int:
    """Günün toplam sayfasından elde edilen TAM SAYI taban XP (aşağı yuvarlanmış)."""
    return cumulative_base_xp_x10(pages_today) // 10


def daily_target_bonus(pages_today: int, daily_target: int) -> int:
    """Günlük hedef tamamlandıysa (toplam sayfa >= hedef) +15 XP, değilse 0."""
    if daily_target > 0 and pages_today >= daily_target:
        return TARGET_BONUS_XP
    return 0


def daily_streak_bonus(
    pages_today: int,
    streak_before: int,
    min_pages: int = MIN_PAGES_FOR_STREAK,
) -> int:
    """
    Günlük streak bonusu = taban_xp * yüzde // 100.
    `streak_before`: bugünden ÖNCEKİ streak. Bugün nitelikli olursa (sayfa >= min_pages)
    günün streak değeri streak_before + 1 sayılır; yüzde buna göre seçilir.
    """
    if streak_before < 0:
        raise ValueError("Streak negatif olamaz.")
    streak_today = streak_before + (1 if pages_today >= min_pages else 0)
    return daily_base_xp(pages_today) * streak_percent(streak_today) // 100


def calculate_reading_xp(
    pages_read: int,
    daily_target: int = 0,
    already_read_today: int = 0,
    streak_before: int = 0,
    min_pages: int = MIN_PAGES_FOR_STREAK,
) -> Dict[str, int]:
    """
    Bir okuma OTURUMUNDAN kazanılan XP'yi hesaplar.

    Parametreler:
        pages_read: bu oturumda okunan sayfa (>= 0)
        daily_target: kullanıcının (sunucuda kayıtlı) günlük hedefi; 0 ise bonus yok
        already_read_today: bugün bu oturumdan önce okunan toplam sayfa
        streak_before: bugünden önceki streak (günün ilk isteğinde sabitlenir)

    Döner (hepsi int, hepsi >= 0):
        raw_pages, base_xp, target_bonus_xp, streak_multiplier_xp,
        base_plus_target_xp  : taban + hedef bonusu (streak hariç),
        reading_total_xp     : taban + hedef + streak (kitap/quiz hariç),
        is_target_completed  : hedef BU oturumda tamamlandı mı (bool)
    """
    if pages_read < 0:
        raise ValueError("Okunan sayfa sayısı negatif olamaz.")
    if already_read_today < 0:
        raise ValueError("Bugün daha önce okunan sayfa negatif olamaz.")

    before = already_read_today
    after = already_read_today + pages_read

    base = daily_base_xp(after) - daily_base_xp(before)
    target = daily_target_bonus(after, daily_target) - daily_target_bonus(before, daily_target)
    streak = (
        daily_streak_bonus(after, streak_before, min_pages)
        - daily_streak_bonus(before, streak_before, min_pages)
    )
    return {
        "raw_pages": pages_read,
        "base_xp": base,
        "target_bonus_xp": target,
        "streak_multiplier_xp": streak,
        "base_plus_target_xp": base + target,
        "reading_total_xp": base + target + streak,
        "is_target_completed": target > 0,
    }


# ─── Kitap ve quiz ────────────────────────────────────────────────
def calculate_book_completion_xp(
    book_total_pages: int,
    max_bonus: int = MAX_BOOK_COMPLETION_XP,
) -> int:
    """Kitap sayfasının %20'si (tam sayı bölmesi), en fazla `max_bonus` XP."""
    if book_total_pages <= 0:
        raise ValueError("Kitap sayfa sayısı pozitif olmalıdır.")
    return min(book_total_pages * BOOK_COMPLETION_PERCENT // 100, max_bonus)


def calculate_quiz_xp(correct_answers: int, total_questions: int) -> int:
    """Doğru cevap başına 5 XP."""
    if total_questions < 0 or correct_answers < 0:
        raise ValueError("Soru sayıları negatif olamaz.")
    if correct_answers > total_questions:
        raise ValueError("Doğru sayısı toplam soru sayısını aşamaz.")
    return correct_answers * QUIZ_XP_PER_CORRECT


# ─── Seviye ───────────────────────────────────────────────────────
def level_threshold(level: int) -> int:
    """L. seviyeye ulaşmak için gereken kümülatif XP: 100 (L-1)^2."""
    if level < 1:
        raise ValueError("Seviye en az 1 olmalıdır.")
    return 100 * (level - 1) ** 2


def marginal_level_cost(level: int) -> int:
    """L -> L+1 geçişinin XP maliyeti: 100 (2L - 1)."""
    if level < 1:
        raise ValueError("Seviye en az 1 olmalıdır.")
    return 100 * (2 * level - 1)


def calculate_level(total_xp: int) -> Tuple[int, int, int, float]:
    """
    Döner: (seviye, sonraki_seviye_eşiği, sonraki_seviyeye_kalan_xp, ilerleme_yüzdesi)
    Level = isqrt(total_xp) // 10 + 1   (float kullanılmaz)
    """
    if total_xp < 0:
        raise ValueError("Toplam XP negatif olamaz.")
    level = math.isqrt(total_xp) // 10 + 1
    base = level_threshold(level)
    nxt = level_threshold(level + 1)
    needed = nxt - total_xp
    progress = round(100 * (total_xp - base) / (nxt - base), 2)
    return level, nxt, needed, progress
