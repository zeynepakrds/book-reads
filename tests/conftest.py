"""pytest ayarı: `src` klasörünü import yoluna ekler (tests/ içinden `gamification` import edilebilsin)."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
