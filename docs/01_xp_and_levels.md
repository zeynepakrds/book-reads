# BookReads Gamification Şartnamesi — Bölüm 1: XP, Seviyeler ve Anti-Spam

**Sorumlu:** Matematik Ekibi (XP & Level Tasarımı)  
**Tarih:** Hafta 1  
**Durum:** Taslak / Kodlandı ve Test Edildi  
**Referans Kod:** `src/gamification/xp_engine.py`  
**Birim Testler:** `tests/test_xp_engine.py`  

---

## 1. Temel XP Kazanım Kuralları

Kullanıcıların okuma motivasyonunu sürekli canlı tutmak amacıyla deneyim puanı (XP) dağıtım kuralları şu şekilde belirlenmiştir:

| Eylem | Kazanılan XP | Açıklama |
|---|---|---|
| **Sayfa Okuma (Temel)** | +1 XP / sayfa | Okunan her sayfa için temel kazanım (günlük 100 sayfaya kadar). |
| **Günlük Hedef Tamamlama** | +15 XP (Bonus) | Kullanıcının belirlediği günlük hedef (örn. 25 sayfa) tamamlandığında 1 kez verilir. |
| **Kitap Bitirme Bonusu** | Toplam Sayfa × 0.20 | Kitap tamamlandığında sayfa sayısının %20'si kadar ekstra toplu bonus verilir (Örn: 350 sayfalık kitap = +70 XP). |
| **Kitap Quiz Başarısı** | +5 XP / doğru cevap | Kitapla ilgili quizlerde doğru bilinen her soru için. |

---

## 2. Suistimal ve Bot Koruması (Diminishing Returns / Soft Cap)

Kullanıcıların haksız seviye atlamasını ve bir günde binlerce sayfa girmesini engellemek için **kademeli azalan getiri** kuralı uygulanır:

- **0 – 100 Sayfa / gün:** %100 XP (1 sayfa = 1.0 XP)
- **101 – 250 Sayfa / gün:** %50 XP (1 sayfa = 0.5 XP)
- **251+ Sayfa / gün:** %10 XP (1 sayfa = 0.1 XP)
- **Günlük Maksimum Temel XP Tavanı:** 200 XP (Bonuslar hariç bir gün içinde sadece okuma yaparak kazanılabilecek tavan puan).

*Örnek:* Bir günde 300 sayfa okuma giren bir kullanıcı, 300 XP yerine:  
`(100 × 1.0) + (150 × 0.5) + (50 × 0.1) = 100 + 75 + 5 = 180 XP` kazanır.

---

## 3. Seviye Atlama (Level Progression) Eğrisi

Kullanıcıların ilk seviyeleri hızlı geçip oyuna ısınmasını, ileri seviyelerde ise rekabetin dengeli kalmasını sağlayan **polinomiyal karekök modeli** benimsenmiştir:

### 3.1. Seviye Hesaplama Formülü:
$$\text{Level}(XP) = \left\lfloor 0.1 \times \sqrt{\text{Toplam XP}} \right\rfloor + 1$$

Tersinden, bir seviyeye ulaşmak için gereken toplam XP eşiği:
$$\text{Gereken XP}(L) = \left( \frac{L - 1}{0.1} \right)^2 = 100 \times (L - 1)^2$$

### 3.2. Seviye Eşikleri ve İlerleme Tablosu:

| Seviye (Level) | Gereken Toplam XP | Seviye Unvanı | Ortalama Okuma Karşılığı |
|---|---|---|---|
| **Level 1** | 0 XP | Yeni Başlayan | 0 sayfa |
| **Level 2** | 100 XP | Meraklı Okur | ~100 sayfa (veya 1 kısa kitap) |
| **Level 3** | 400 XP | Kitap Dostu | ~350 sayfa + bonuslar |
| **Level 4** | 900 XP | Kitap Kurdu | ~2-3 kitap |
| **Level 5** | 1.600 XP | Edebiyat Gezgini | ~5 kitap |
| **Level 6** | 2.500 XP | Satır Avcısı | ~8 kitap |
| **Level 7** | 3.600 XP | Sayfa Ustası | ~12 kitap |
| **Level 8** | 4.900 XP | Kütüphane Sakini | ~16 kitap |
| **Level 9** | 6.400 XP | Hikaye Muhafızı | ~20 kitap |
| **Level 10** | 8.100 XP | Bilge / Filozof | ~25+ kitap |

---

## 4. Matematiksel Doğrulama & Edge Case Senaryoları
- **Negatif Sayfa Girişi:** Sistem `sayfa_sayisi < 0` durumunda `ValueError` fırlatır, geçersiz veri tabana işlenmez.
- **Sıfır Sayfa Girişi:** 0 XP ve `is_target_completed: False` döner.
- **Kesirli Puan Yuvarlama:** Seviye içi yüzdeler ondalıklı (`round(..., 1)`), toplam XP ise en yakın tam sayıya yuvarlanır.
- **Çoklu Giriş:** Gün içinde parça parça sayfa ekleme durumunda `already_read_today` parametresiyle önceki kademe korunur.
