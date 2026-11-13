"""
BookReads Gamification Motoru - XP, Seviye ve Anti-Spam Hesaplayıcı
Sorumlu: Matematik Ekibi
"""

import math
from typing import Dict, Any, Tuple


def calculate_reading_xp(
    pages_read: int,
    daily_target: int = 0,
    already_read_today: int = 0
) -> Dict[str, Any]:
    """
    Okunan sayfa sayısına göre kazanılan temel XP, azalan getiri (anti-spam)
    ve günlük hedef tamamlama bonusunu hesaplar.

    Parametreler:
        pages_read: Bu seansta okunan sayfa sayısı (>= 0)
        daily_target: Kullanıcının günlük hedefi (örn. 25 sayfa, 0 ise devre dışı)
        already_read_today: Kullanıcının bugün daha önce okuduğu toplam sayfa sayısı

    Döner:
        {
            "raw_pages": int,
            "base_xp": float,
            "target_bonus_xp": int,
            "total_earned_xp": int,
            "is_target_completed": bool
        }
    """
    if pages_read < 0:
        raise ValueError("Okunan sayfa sayısı negatif olamaz.")

    if pages_read == 0:
        return {
            "raw_pages": 0,
            "base_xp": 0.0,
            "target_bonus_xp": 0,
            "total_earned_xp": 0,
            "is_target_completed": False
        }

    # Günlük azalan getiri (Diminishing Returns) kademeleri:
    # 0 - 100 sayfa: %100 getiri (1 sayfa = 1.0 XP)
    # 101 - 250 sayfa: %50 getiri (1 sayfa = 0.5 XP)
    # 251+ sayfa: %10 getiri (1 sayfa = 0.1 XP)
    # Günlük tavan: Maksimum 200 temel XP
    start_page = already_read_today
    end_page = already_read_today + pages_read
    earned_base_xp = 0.0

    for p in range(start_page + 1, end_page + 1):
        if p <= 100:
            rate = 1.0
        elif p <= 250:
            rate = 0.5
        else:
            rate = 0.1
        earned_base_xp += rate

    # Günlük 200 XP tavan kontrolü
    # Eğer önceden kazanılan puanlarla birlikte 200'ü aşıyorsa sınırla
    max_daily_base_xp = 200.0
    # Önceki sayfaların taban XP'si
    prev_xp = 0.0
    for p in range(1, start_page + 1):
        if p <= 100:
            prev_xp += 1.0
        elif p <= 250:
            prev_xp += 0.5
        else:
            prev_xp += 0.1
        if prev_xp >= max_daily_base_xp:
            prev_xp = max_daily_base_xp
            break

    total_with_new = prev_xp + earned_base_xp
    if total_with_new > max_daily_base_xp:
        earned_base_xp = max(0.0, max_daily_base_xp - prev_xp)

    # Hedef tamamlama bonusu kontrolü
    target_bonus = 0
    is_target_completed = False
    if daily_target > 0:
        was_completed = already_read_today >= daily_target
        now_completed = end_page >= daily_target
        if not was_completed and now_completed:
            target_bonus = 15
            is_target_completed = True

    total_xp = int(round(earned_base_xp)) + target_bonus

    return {
        "raw_pages": pages_read,
        "base_xp": round(earned_base_xp, 2),
        "target_bonus_xp": target_bonus,
        "total_earned_xp": total_xp,
        "is_target_completed": is_target_completed
    }


def calculate_book_completion_xp(book_total_pages: int) -> int:
    """
    Kitap tamamlandığında sayfa sayısının %20'si kadar bitirme bonusu hesaplar.
    Örnek: 300 sayfalık kitap -> 60 XP.
    """
    if book_total_pages <= 0:
        raise ValueError("Kitap sayfa sayısı pozitif olmalıdır.")
    return int(round(book_total_pages * 0.20))


def calculate_level(total_xp: int) -> Tuple[int, int, int, float]:
    """
    Toplam XP değerine göre mevcut seviyeyi, bir sonraki seviye için
    gereken XP eşiğini ve mevcut seviyedeki ilerleme yüzdesini hesaplar.

    Formül:
        Level = floor(0.1 * sqrt(total_xp)) + 1
        Gereken_XP(L) = 100 * (L - 1)^2

    Döner:
        (mevcut_seviye, bir_sonraki_seviye_esigi, bir_sonraki_seviyeye_kalan_xp, ilerleme_yuzdesi)
    """
    if total_xp < 0:
        raise ValueError("Toplam XP negatif olamaz.")

    # Seviye hesabı
    level = int(math.floor(0.1 * math.isqrt(total_xp))) + 1

    # Mevcut seviyenin başladığı XP ve bir sonraki seviyenin XP eşiği
    current_level_base_xp = 100 * ((level - 1) ** 2)
    next_level_target_xp = 100 * (level ** 2)

    needed_xp = next_level_target_xp - total_xp
    level_xp_range = next_level_target_xp - current_level_base_xp

    progress_in_level = total_xp - current_level_base_xp
    progress_percentage = round((progress_in_level / level_xp_range) * 100, 1)

    return level, next_level_target_xp, needed_xp, progress_percentage
