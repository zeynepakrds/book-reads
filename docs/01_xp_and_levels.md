# BookReads Gamification Şartnamesi — Bölüm 1: XP, Seviyeler ve Anti-Spam

**Sorumlu:** Matematik Ekibi (XP & Level Tasarımı)  
**Tarih:** Hafta 1  
**Durum:** Taslak / Onaylandı  

---

## 1. Temel XP Kazanım Kuralları

Kullanıcıların okuma motivasyonunu sürekli canlı tutmak amacıyla deneyim puanı (XP) dağıtım kuralları şu şekilde belirlenmiştir:

| Eylem | Kazanılan XP | Açıklama |
|---|---|---|
| **Sayfa Okuma (Temel)** | +1 XP / sayfa | Okunan her sayfa için temel kazanım. |
| **Günlük Hedef Tamamlama** | +15 XP (Bonus) | Kullanıcının belirlediği günlük hedef (örn. 25 sayfa) tamamlandığında 1 kez verilir. |
| **Kitap Bitirme Bonusu** | Toplam Sayfa × 0.20 | Kitap tamamlandığında sayfa sayısının %20'si kadar ekstra toplu bonus verilir (Örn: 300 sayfalık kitap = +60 XP). |
| **Kitap Quiz Başarısı** | +5 XP / doğru cevap | Kitapla ilgili quizlerde doğru bilinen her soru için. |

---

## 2. Suistimal ve Bot Koruması (Diminishing Returns / Soft Cap)

Kullanıcıların haksız seviye atlamasını ve bir günde binlerce sayfa girmesini engellemek için **kademeli azalan getiri** kuralı uygulanır:

- **0 – 100 Sayfa / gün:** %100 XP (1 sayfa = 1 XP)
- **101 – 250 Sayfa / gün:** %50 XP (1 sayfa = 0.5 XP)
- **251+ Sayfa / gün:** %10 XP (1 sayfa = 0.1 XP)
- **Günlük Maksimum Temel XP Tavanı:** 200 XP (Bonuslar hariç bir gün içinde sadece okuma yaparak kazanılabilecek tavan puan).

---

## 3. Seviye Atlama (Level Progression) Eğrisi

Kullanıcıların ilk seviyeleri hızlı geçip oyuna ısınmasını, ileri seviyelerde ise rekabetin dengeli kalmasını sağlayan **polinomiyal karekök modeli** benimsenmiştir:

### 3.1. Formül:
$$\text{Level}(XP) = \left\lfloor 0.1 \times \sqrt{\text{Toplam XP}} \right\rfloor + 1$$

Tersinden, bir seviyeye ulaşmak için gereken toplam XP:
$$\text{Gereken XP}(L) = \left( \frac{L - 1}{0.1} \right)^2 = 100 \times (L - 1)^2$$

### 3.2. Seviye Eşikleri Tablosu:

| Seviye (Level) | Gereken Toplam XP | Seviye Unvanı | Ortalama Okuma Karşılığı |
|---|---|---|---|
| **Level 1** | 0 XP | Yeni Başlayan | 0 sayfa |
| **Level 2** | 100 XP | Meraklı Okur | ~100 sayfa (veya 1 kısa kitap) |
| **Level 3** | 400 XP | Kitap Dostu | ~350 sayfa + bonuslar |
| **Level 4** | 900 XP | Kitap Kurdu | ~2-3 kitap |
| **Level 5** | 1.600 XP | Edebiyat Gezgini | ~5 kitap |
| **Level 10** | 8.100 XP | Bilge / Kütüphaneci | ~25+ kitap |

---

## 4. Matematiksel Doğrulama & Edge Case Senaryoları
- **Negatif Sayfa Girişi:** Sistem `sayfa_sayisi <= 0` durumunda hata (`ValueError`) fırlatır, XP verilmez.
- **Kesirli Puanlar:** Seviye ve XP toplamları her işlem sonunda en yakın tam sayıya yuvarlanır (`round` veya `floor`).
