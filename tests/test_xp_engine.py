"""
BookReads XP & Seviye Motoru Birim Testleri
TDD ve Uç Durum (Edge-Case) Kapsamı
"""

import pytest
import sys
import os

# src klasörünü PYTHONPATH'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from gamification.xp_engine import (
    calculate_reading_xp,
    calculate_book_completion_xp,
    calculate_level,
)


class TestReadingXP:
    """Okuma sayfa sayısı ve günlük hedef hesaplama testleri"""

    def test_standard_reading_under_100_pages(self):
        """100 sayfa altı normal okuma 1 sayfa = 1 XP getirmeli"""
        result = calculate_reading_xp(pages_read=30)
        assert result["raw_pages"] == 30
        assert result["base_xp"] == 30.0
        assert result["target_bonus_xp"] == 0
        assert result["total_earned_xp"] == 30

    def test_zero_pages_read(self):
        """0 sayfa okuma 0 XP getirmeli"""
        result = calculate_reading_xp(pages_read=0)
        assert result["total_earned_xp"] == 0
        assert result["is_target_completed"] is False

    def test_negative_pages_read_raises_error(self):
        """Negatif sayfa okuma ValueError fırlatmalı"""
        with pytest.raises(ValueError, match="negatif olamaz"):
            calculate_reading_xp(pages_read=-5)

    def test_daily_target_bonus_awarded(self):
        """Günlük hedef tamamlandığında +15 XP bonus verilmeli"""
        result = calculate_reading_xp(pages_read=25, daily_target=20, already_read_today=0)
        assert result["base_xp"] == 25.0
        assert result["target_bonus_xp"] == 15
        assert result["total_earned_xp"] == 40
        assert result["is_target_completed"] is True

    def test_daily_target_bonus_not_awarded_twice(self):
        """Hedef daha önce tamamlanmışsa bonus ikinci kez verilmemeli"""
        result = calculate_reading_xp(pages_read=10, daily_target=20, already_read_today=20)
        assert result["base_xp"] == 10.0
        assert result["target_bonus_xp"] == 0
        assert result["is_target_completed"] is False


class TestAntiSpamDiminishingReturns:
    """Anti-Spam ve Kademeli Azalan Getiri Testleri"""

    def test_diminishing_returns_second_tier(self):
        """100 sayfadan sonraki sayfalar %50 (0.5 XP) getirmeli"""
        # İlk 100 sayfa = 100 XP, sonraki 50 sayfa = 25 XP -> Toplam 125 XP
        result = calculate_reading_xp(pages_read=150)
        assert result["base_xp"] == 125.0
        assert result["total_earned_xp"] == 125

    def test_diminishing_returns_third_tier(self):
        """250 sayfadan sonraki sayfalar %10 (0.1 XP) getirmeli"""
        # 100 sayfa = 100 XP
        # 150 sayfa = 75 XP
        # 50 sayfa = 5 XP
        # Toplam: 180 XP
        result = calculate_reading_xp(pages_read=300)
        assert result["base_xp"] == 180.0
        assert result["total_earned_xp"] == 180

    def test_daily_cap_limits_excessive_reading(self):
        """Günde 1.000 sayfa girilse dahi tavan 200 temel XP'yi aşamaz"""
        result = calculate_reading_xp(pages_read=1000)
        assert result["base_xp"] == 200.0
        assert result["total_earned_xp"] == 200


class TestBookCompletionXP:
    """Kitap tamamlama bonusu testleri"""

    def test_book_completion_standard(self):
        """300 sayfalık kitap için %20 (60 XP) bitirme bonusu verilmeli"""
        bonus = calculate_book_completion_xp(300)
        assert bonus == 60

    def test_book_completion_fractional_rounding(self):
        """Küsuratlı durumlarda yuvarlama düzgün çalışmalı"""
        bonus = calculate_book_completion_xp(123)
        assert bonus == 25  # 123 * 0.20 = 24.6 -> 25

    def test_book_completion_invalid_pages(self):
        """Geçersiz sayfa sayısında hata fırlatmalı"""
        with pytest.raises(ValueError):
            calculate_book_completion_xp(0)


class TestLevelProgression:
    """Seviye atlama formülü ve eşik testleri"""

    def test_initial_level_at_zero_xp(self):
        """0 XP ile başlayan kullanıcı Level 1 olmalı"""
        level, next_xp, needed_xp, progress = calculate_level(0)
        assert level == 1
        assert next_xp == 100
        assert needed_xp == 100
        assert progress == 0.0

    def test_level_two_boundary(self):
        """Tam 100 XP'de kullanıcı Level 2 olmalı"""
        level, next_xp, needed_xp, progress = calculate_level(100)
        assert level == 2
        assert next_xp == 400
        assert needed_xp == 300
        assert progress == 0.0

    def test_mid_level_progress(self):
        """Seviye içi ilerleme yüzdesi doğru hesaplanmalı"""
        # Level 2 (100 ile 400 XP arası, aralık 300 XP). 250 XP -> aralıkta 150 ilerledi -> %50
        level, next_xp, needed_xp, progress = calculate_level(250)
        assert level == 2
        assert next_xp == 400
        assert needed_xp == 150
        assert progress == 50.0

    def test_high_level_progression(self):
        """Yüksek XP durumunda (ör. 10.000 XP) formül doğruluğu"""
        # sqrt(10000) = 100 -> floor(0.1 * 100) + 1 = 11
        level, next_xp, needed_xp, _ = calculate_level(10000)
        assert level == 11
        assert next_xp == 12100
        assert needed_xp == 2100

    def test_negative_xp_raises_error(self):
        """Negatif XP değerinde hata fırlatmalı"""
        with pytest.raises(ValueError):
            calculate_level(-10)
