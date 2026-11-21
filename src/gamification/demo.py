"""
BookReads Gamification Simülasyon Demousu
Matematik ekibinin algoritmalarını konsoldan test etmek için çalıştırılabilir script.
"""

from gamification.xp_engine import calculate_reading_xp, calculate_book_completion_xp, calculate_level


def main():
    print("=" * 60)
    print("📚 BookReads Gamification & XP Motoru Simülasyonu")
    print("=" * 60)

    # Senaryo 1: Standart Günlük Okuma
    print("\n[1] Senaryo 1: Ayşe günde 25 sayfa okuyor (Günlük Hedef: 20 sayfa)")
    res1 = calculate_reading_xp(pages_read=25, daily_target=20, already_read_today=0)
    print(f"  -> Okunan Sayfa: {res1['raw_pages']}")
    print(f"  -> Temel XP: {res1['base_xp']}")
    print(f"  -> Hedef Bonusu: +{res1['target_bonus_xp']} XP (Hedef tamamlandı mı: {res1['is_target_completed']})")
    print(f"  -> Toplam Kazanılan: {res1['total_earned_xp']} XP")

    # Senaryo 2: Anti-Spam (Aşırı Okuma)
    print("\n[2] Senaryo 2: Mehmet bir günde 300 sayfa okuduğunu iddia ediyor")
    res2 = calculate_reading_xp(pages_read=300)
    print(f"  -> Okunan Sayfa: {res2['raw_pages']}")
    print(f"  -> Kademeli Azalan XP: {res2['base_xp']} XP (Normalde 300 XP yerine 180 XP verildi)")

    # Senaryo 3: Kitap Bitirme Bonusu
    print("\n[3] Senaryo 3: 350 sayfalık bir kitap bitirildi")
    bonus = calculate_book_completion_xp(350)
    print(f"  -> Kitap Bitirme Bonusu (%20): +{bonus} XP")

    # Senaryo 4: Seviye Atlama İlerlemesi
    print("\n[4] Senaryo 4: Seviye Durumu (Örn: Kullanıcının 650 Toplam XP'si var)")
    lvl, next_target, needed, pct = calculate_level(650)
    print(f"  -> Mevcut Seviye: Seviye {lvl}")
    print(f"  -> Seviye {lvl + 1} için Gereken Toplam XP: {next_target} XP")
    print(f"  -> Kalan XP: {needed} XP")
    print(f"  -> İlerleme: %{pct}")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
