# BookReads Gamification — Matematiksel Modelleme ve Simülasyon Raporu

**Sorumlu:** Matematik Ekibi (Algoritma ve Modelleme)  
**Tarih:** Hafta 2  
**Durum:** İncelemeye Hazır (Taslak)  
**Referans kod:** `src/gamification/xp_engine.py`, `src/gamification/streak.py`, `src/gamification/simulator.py`  
**Testler:** `tests/test_xp_engine.py`, `tests/test_streak.py`, `tests/test_simulator.py` (çalıştırma: `python3 -m pytest tests/ -v`)  
**Ham çıktılar:** `docs/simulation_results.txt`  

---

## 1. Amaç ve Tasarım Hedefleri

Bu rapor, BookReads oyunlaştırma mekaniğinin (XP, seviye, streak, freeze) matematiksel tanımını ve kullanıcı davranış simülasyonlarını belgeler.

1. **Tutundurma:** Yeni okurlar ilk günlerde hızlı seviye atlayarak başarı hissini tatmalı.
2. **Sürdürülebilirlik:** İleri seviye okurlar için ilerleme durmamalı; marjinal maliyet öngörülebilir biçimde artmalı.
3. **Açık uçlu seviyeler:** Seviye için yapay bir üst sınır yoktur ($L \to \infty$).
4. **Ekonomi dengesi:** Bonuslar ve streak çarpanı kontrolsüz XP enflasyonu yaratmamalı (Bölüm 7).
5. **Tekrar üretilebilirlik:** Tüm sayılar, repodaki komutla yeniden üretilebilmeli (Bölüm 5.4).

---

## 2. Seviye Eğrisi

### 2.1. Model Seçimi

| Model | Formül | Avantaj | Dezavantaj | Karar |
|---|---|---|---|---|
| Lineer | $XP(L) = k \cdot L$ | Anlaşılması kolay | Marjinal maliyet sabit; ileri seviyede zorluk artmaz | Reddedildi |
| Üstel | $XP(L) = a \cdot b^L$ | İleri seviyelerde çok zorlaşır | "Seviye duvarı" yaratır, kullanıcı bırakır | Reddedildi |
| İkinci dereceden | $XP(L) = 100\,(L-1)^2$ | Marjinal maliyet doğrusal artar: başta tatmin edici, sonra dengeli | Ham formül kullanıcıya gösterilmemeli, ilerleme yüzdesi gösterilmeli | **Kabul edildi** |

Not: Eşik fonksiyonu $L$'nin ikinci dereceden bir fonksiyonudur; seviyeyi XP'den veren ters fonksiyon ise karekök içerir.

### 2.2. Kabul Edilen Fonksiyonlar

$$\text{Threshold}(L) = 100\,(L-1)^2$$

$$\text{Level}(XP) = \left\lfloor \frac{\operatorname{isqrt}(XP)}{10} \right\rfloor + 1$$

Uygulamada `math.isqrt` ile tam sayı aritmetiği kullanılır; kayan nokta yuvarlama riski yoktur. Örnek eşikler:

| Seviye | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Eşik (XP) | 0 | 100 | 400 | 900 | 1.600 | 2.500 | 3.600 | 4.900 | 6.400 | 8.100 | 10.000 |

### 2.3. Marjinal Seviye Maliyeti

$$\Delta XP_L = \text{Threshold}(L+1) - \text{Threshold}(L) = 100\,\bigl[L^2 - (L-1)^2\bigr] = 100\,(2L - 1)$$

Örnekler: $L=1$: 100 XP; $L=2$: 300 XP; $L=5$: 900 XP; $L=9$: **1.700 XP**; $L=10$: 1.900 XP. Formül her $L$ için geçerlidir; Level 10'dan sonra da devam eder.

Aşağıdaki süreler, Bölüm 5'teki 90 günlük Monte Carlo ortalamalarından türetilmiştir (ortalama XP hızı: Casual ≈ 14,5 XP/gün, Regular ≈ 40,6 XP/gün, Hardcore ≈ 92,4 XP/gün). Hızlar sabit olmadığı için değerler yaklaşıktır.

| Geçiş | Maliyet (XP) | Casual | Regular | Hardcore |
|---|---:|---:|---:|---:|
| Level 1 → 2 | 100 | ~7 gün | ~2 gün | ~1 gün |
| Level 2 → 3 | 300 | ~21 gün | ~7 gün | ~3 gün |
| Level 5 → 6 | 900 | ~62 gün | ~22 gün | ~10 gün |
| Level 9 → 10 | 1.700 | ~117 gün | ~42 gün | ~18 gün |
| Level 10 → 11 | 1.900 | ~131 gün | ~47 gün | ~21 gün |

Seviye unvanları (isimlendirme) UI ekibinin kararıdır ve bu rapordaki formülleri etkilemez.

---

## 3. XP Kuralları (Kesin Tanım)

Tüm değerler **tam sayıdır** ve aşağı yuvarlanır. Günlük XP, günün **toplam** sayfası $s$'nin fonksiyonudur.

### 3.1. Günlük Taban XP

Önce 10 katı olarak kümülatif değer tanımlanır:

$$C(s) = \min\left(2000,\; \begin{cases} 10\,s & s \le 100 \\ 1000 + 5\,(s-100) & 100 < s \le 250 \\ 1750 + (s-250) & s > 250 \end{cases}\right), \qquad B(s) = \left\lfloor \frac{C(s)}{10} \right\rfloor$$

Yani 1–100. sayfa 1,0 XP; 101–250. sayfa 0,5 XP; 251+ sayfa 0,1 XP; günlük taban tavanı **200 XP**. Sınır değerler: $B(100)=100$, $B(101)=100$, $B(250)=175$, $B(251)=175$, $B(500)=200$, $B(501)=200$. (Bu değerler testlerle sabitlenmiştir.)

### 3.2. Günlük Hedef Bonusu

$$T(s) = \begin{cases} 15 & g > 0 \text{ ve } s \ge g \\ 0 & \text{aksi halde} \end{cases}$$

Burada $g$ kullanıcının sunucuda kayıtlı günlük hedefidir. Bonus günde en fazla bir kez verilir.

### 3.3. Streak Bonusu

$n$ = günün streak değeri (bugünden önceki streak $n_0$ artı, bugün nitelikli olduysa 1):

$$n(s) = n_0 + \mathbf{1}[s \ge 10], \qquad p(n) = \begin{cases} 25 & n \ge 30 \\ 15 & 14 \le n < 30 \\ 10 & 7 \le n < 14 \\ 0 & n < 7 \end{cases}, \qquad S(s) = \left\lfloor \frac{B(s)\,p(n(s))}{100} \right\rfloor$$

Çarpan **yalnızca taban XP'ye** uygulanır; hedef bonusu, kitap ve quiz XP'si çarpana girmez.

### 3.4. Oturum Payı ve Bölünmeden Bağımsızlık

Günlük kümülatif okuma XP'si $X(s) = B(s) + T(s) + S(s)$ olsun. Bir oturumda daha önce $a$ sayfa okunmuş ve $r$ sayfa daha okunmuşsa oturumun payı:

$$\Delta X = X(a + r) - X(a)$$

* **Bölünmeden bağımsızlık:** Oturum payları toplanınca ardışık terimler birbirini götürür (teleskopik toplam). Dolayısıyla günlük toplam XP, sayfaların kaç oturuma bölündüğünden bağımsızdır: $\sum \Delta X = X(\text{toplam}) - X(0) = X(\text{toplam})$.
* **Negatif pay olmaz:** $B$ ve $T$ azalmayan fonksiyonlardır; $p(n(s))$ de $s$ ile azalmaz. Azalmayan ve negatif olmayan iki fonksiyonun çarpımının tam kısmı da azalmayan olduğundan $S$ ve dolayısıyla $X$ azalmaz.

Bu özellik `tests/test_xp_engine.py` içinde, çok sayıda oturum bölünmesi için ($n_0$ ve hedef değerleriyle birlikte) doğrulanır. Böylece "1 sayfa × 35 oturum" ile "tek seferde 35 sayfa" aynı XP'yi verir.

### 3.5. Kitap ve Quiz

* Kitap bitirme: $\min\bigl(\lfloor 0{,}20 \cdot \text{sayfa} \rfloor,\; 200\bigr)$, kullanıcı başına kitap başına **bir kez** (DB kısıtı: `UNIQUE(user_id, book_id)`).
* Quiz: doğru cevap başına 5 XP, quiz başına **yalnızca ilk deneme** (`UNIQUE(user_id, quiz_id)`).

### 3.6. Günlük Okuma XP'sinin Üst Sınırı

$$X_{\max} = 200 + 15 + \left\lfloor \frac{200 \cdot 25}{100} \right\rfloor = 265 \text{ XP/gün}$$

Bu sınır testlerle de doğrulanır (10.000 sayfa, 500 günlük streak girdisiyle bile 265'i aşmaz).

---

## 4. Streak ve Freeze Kuralları

Bir gün, o günün toplam sayfası **en az 10** ise *nitelikli*dir.

| Gün durumu | Streak > 0 ve freeze var | Streak > 0 ve freeze yok | Streak = 0 |
|---|---|---|---|
| Nitelikli | streak +1 | streak +1 | streak +1 |
| Nitelikli değil (hiç okunmadı veya < 10 sayfa) | 1 freeze harcanır, streak **korunur** (artmaz) | streak **0'a düşer** | değişiklik yok (freeze harcanmaz) |

* Her takvim haftasının **Pazartesi** günü freeze kredisi 1'e **setlenir** (birikmez).
* En uzun streak rekoru sıfırlanmada silinmez.
* **Backend eşdeğerliği:** Backend günleri tek tek işlemez; kullanıcı döndüğünde `settle_until` fonksiyonu kaçırılan günleri sırayla, simülatördeki aynı kuralla işler. `tests/test_streak.py`, rastgele gün dizileri için "tembel yeniden oynatma = her günü işleme" eşitliğini doğrular.
* **Gece kuşu ve hafta sınırı:** Yerel saat 00:00–02:59 okumaları bir önceki güne yazılır; freeze haftası da bu *effective_date*'e göre başlar (ayrıntı: `docs/04_database_schema_contract.md`).

---

## 5. Kullanıcı Davranış Simülasyonu (Monte Carlo)

### 5.1. Persona Parametreleri

| Parametre | Casual | Regular | Hardcore |
|---|---:|---:|---:|
| Okunan günlerde ort. sayfa ($\mu$) | 10 | 25 | 55 |
| Standart sapma ($\sigma$) | 5 | 8 | 15 |
| Günlük hedef (sayfa) | 10 | 20 | 40 |
| Günü atlama olasılığı | %30 | %10 | %3 |
| Ortalama kitap uzunluğu (sayfa) | 200 | 280 | 350 |
| Quiz: soru doğru olasılığı | %60 | %70 | %85 |
| Kitap başına quiz sorusu | 5 | 5 | 10 |

Bu değerler **varsayımdır**; gerçek kullanıcı verisinden tahmin edilmemiştir (Bölüm 8).

### 5.2. Yöntem

* Her gün: olasılıkla atlanır; aksi halde sayfa $\max\bigl(1, \operatorname{round}(\mathcal{N}(\mu,\sigma))\bigr)$ olarak örneklenir.
* XP, Bölüm 3'teki fonksiyonlarla; streak/freeze, Bölüm 4'teki durum makinesiyle hesaplanır.
* **Kitap bitirme sayfa havuzuna bağlıdır:** kümülatif sayfa kitap uzunluğunu aştıkça kitap biter; bu yüzden bitirilen kitap sayısı daima `toplam sayfa // kitap uzunluğu`'na eşittir.
* Quiz cevapları soru başına bağımsız Bernoulli denemesi olarak örneklenir (binom dağılımı).
* Her persona için **1.000 bağımsız koşu**, ana tohum 42. Her koşu 90 gün simüle edilir; 30. ve 60. gün tabloları aynı koşuların ön ekidir, bu yüzden tablolar birbiriyle tutarlıdır.
* Başlangıç günü Perşembe (2026-01-01); haftalık freeze Pazartesi günleri yenilenir.

### 5.3. Sonuçlar

Tablolardaki "± değer", koşular arasındaki **standart sapmadır** (güven aralığı değil). Ortalamanın standart hatası yaklaşık $\sigma/\sqrt{1000} \approx 0{,}03\,\sigma$'dır. "Kırılan streak" = freeze yokken serinin 0'a düştüğü gün sayısı; "nitelikli gün" = en az 10 sayfa okunan gün sayısı.

#### 1.000 koşu, 30. gün — ortalama ± standart sapma
| Metrik | Casual | Regular | Hardcore |
|---|---|---|---|
| **Toplam Okunan Sayfa** | 212 ± 33 | 673 ± 59 | 1.601 ± 94 |
| **Toplam Kazanılan XP** | 418 ± 92 | 1.169 ± 114 | 2.585 ± 154 |
| **Seviye: medyan (P10–P90)** | 3 (2–3) | 4 (4–4) | 6 (5–6) |
| **Bitirilen Kitap** | 0,6 ± 0,5 | 2,0 ± 0,2 | 4,0 ± 0,3 |
| **En Uzun Streak (gün)** | 4,1 ± 1,6 | 21,7 ± 6,3 | 28,6 ± 2,7 |
| **Kullanılan Freeze** | 4,4 ± 0,7 | 2,5 ± 1,1 | 0,8 ± 0,9 |
| **Kırılan Streak (sıfırlanma)** | 5,1 ± 1,3 | 0,9 ± 0,9 | 0,1 ± 0,3 |
| **Nitelikli Gün (≥ eşik)** | 11,4 ± 2,7 | 26,3 ± 1,8 | 29,1 ± 1,0 |

#### 1.000 koşu, 60. gün — ortalama ± standart sapma
| Metrik | Casual | Regular | Hardcore |
|---|---|---|---|
| **Toplam Okunan Sayfa** | 424 ± 48 | 1.348 ± 81 | 3.202 ± 137 |
| **Toplam Kazanılan XP** | 861 ± 123 | 2.409 ± 197 | 5.454 ± 270 |
| **Seviye: medyan (P10–P90)** | 3 (3–4) | 5 (5–6) | 8 (8–8) |
| **Bitirilen Kitap** | 1,7 ± 0,5 | 4,3 ± 0,5 | 8,7 ± 0,5 |
| **En Uzun Streak (gün)** | 5,0 ± 1,8 | 35,9 ± 12,3 | 56,1 ± 6,8 |
| **Kullanılan Freeze** | 8,2 ± 0,8 | 5,1 ± 1,4 | 1,7 ± 1,2 |
| **Kırılan Streak (sıfırlanma)** | 10,8 ± 1,8 | 1,9 ± 1,4 | 0,1 ± 0,4 |
| **Nitelikli Gün (≥ eşik)** | 22,9 ± 3,9 | 52,6 ± 2,5 | 58,2 ± 1,3 |

#### 1.000 koşu, 90. gün — ortalama ± standart sapma
| Metrik | Casual | Regular | Hardcore |
|---|---|---|---|
| **Toplam Okunan Sayfa** | 637 ± 58 | 2.021 ± 100 | 4.808 ± 166 |
| **Toplam Kazanılan XP** | 1.304 ± 142 | 3.657 ± 245 | 8.316 ± 328 |
| **Seviye: medyan (P10–P90)** | 4 (4–4) | 7 (6–7) | 10 (9–10) |
| **Bitirilen Kitap** | 2,8 ± 0,4 | 6,7 ± 0,5 | 13,2 ± 0,6 |
| **En Uzun Streak (gün)** | 5,6 ± 1,7 | 45,7 ± 16,5 | 82,9 ± 11,5 |
| **Kullanılan Freeze** | 12,5 ± 1,0 | 7,7 ± 1,8 | 2,5 ± 1,4 |
| **Kırılan Streak (sıfırlanma)** | 16,1 ± 2,2 | 2,9 ± 1,7 | 0,2 ± 0,5 |
| **Nitelikli Gün (≥ eşik)** | 34,3 ± 4,6 | 78,9 ± 3,1 | 87,2 ± 1,6 |

Tek bir tohumla (seed 42) alınan deterministik referans koşusu (hata ayıklama ve gün gün inceleme için):

#### Deterministik referans koşusu — 90. gün
| Metrik | Casual | Regular | Hardcore |
|---|---|---|---|
| **Toplam Okunan Sayfa** | 680 | 1.993 | 4.517 |
| **Toplam Kazanılan XP** | 1.430 | 3.675 | 7.811 |
| **Ulaşılan Seviye** | Level 4 | Level 7 | Level 9 |
| **Bitirilen Kitap** | 3 | 7 | 12 |
| **En Uzun Streak (gün)** | 5 | 32 | 88 |
| **Kullanılan Freeze** | 12 | 8 | 2 |
| **Kırılan Streak (sıfırlanma)** | 13 | 3 | 0 |
| **Okunan / Atlanan Gün** | 66 / 24 | 80 / 10 | 88 / 2 |

### 5.4. Tekrar Üretilebilirlik

Repo kökünden, tüm sayıları üretir:

```bash
PYTHONPATH=src python3 -m gamification.simulator --all --runs 1000 --seed 42
PYTHONPATH=src python3 -m gamification.simulator --all --runs 1000 --seed 42 --markdown   # rapor tabloları
```

Ham çıktılar `docs/simulation_results.txt` dosyasındadır.

---

## 6. Bulgular

### 6.1. İlerleme Hızı

90 gün sonunda Casual okur 4. seviyede, Regular okur 7. seviyede (medyan), Hardcore okur 10. seviye civarındadır (P10–P90 aralığı 9–10). Seviye için üst sınır olmadığından, Hardcore okur için ilerleme devam eder; ancak her seviye bir öncekinden $200$ XP daha pahalıdır (Bölüm 2.3).

### 6.2. Casual Okur için Streak Mekaniği Zayıf (Tasarım Bulgusu)

Casual personanın hem hedefi hem ortalaması 10 sayfa olduğundan, okuduğu günlerin yaklaşık yarısında 10 sayfaya ulaşamaz. Ayrıca günlerin %30'unu tamamen atlar. 90 günde ortalama olarak:

* yalnızca ~34 gün nitelikli olur (takvim günlerinin ~%38'i),
* haftalık 1 freeze krediyi neredeyse tamamen tüketir (~12,5 / en fazla 14),
* seri ortalama ~16 kez sıfırlanır ve en uzun seri yalnızca ~5,6 gün olur.

Yani streak çarpanı (7 günlük eşik) Casual okurun büyük kısmı için hiç devreye girmez; "tutundurma" hedefi (Bölüm 1) streak mekaniği açısından Casual'da sağlanmaz. Aşağıdaki duyarlılık analizi, olası ayarların etkisini gösterir:

| Senaryo (Casual, 90 gün) | En uzun streak | Kırılan streak | Harcanan freeze | Nitelikli gün |
|---|---:|---:|---:|---:|
| Ana senaryo (eşik 10 sayfa, atlama %30, haftada 1 freeze) | 5,6 | 16,1 | 12,5 | 34,3 |
| Eşik 5 sayfa | 11,9 | 13,4 | 12,5 | 54,7 |
| Haftada 2 freeze | 7,3 | 11,6 | 23,8 | 34,3 |
| Eşik 5 sayfa + haftada 2 freeze | 18,2 | 7,4 | 22,4 | 54,7 |
| Eşik 5 sayfa + atlama olasılığı %15 | 20,2 | 8,9 | 11,4 | 66,2 |

Yorum:

* Streak eşiğini 5 sayfaya çekmek en uzun seriyi yaklaşık iki katına çıkarır (5,6 → 11,9), ama tek başına yeterli değildir.
* Haftalık freeze'i 2'ye çıkarmak tek başına daha az etkilidir; ikisinin birleşimi, mekanik ayarlar arasında en iyi sonucu verir (en uzun seri ~18 gün, kırılma sayısı yarıdan fazla azalır).
* Atlama olasılığı da belirleyicidir: bu bir tasarım parametresi değil, kullanıcı davranışıdır ve oyun mekaniğiyle yalnızca kısmen etkilenebilir.

Önerilen karar seçenekleri (ekip kararı): (a) eşiği `min(10, günlük_hedef)` veya 5 sayfa yapmak; (b) haftalık freeze'i 2 yapmak; (c) mevcut kuralı korumak ve Casual için ayrı bir "haftalık hedef" mekaniği düşünmek. Bu raporun ana tabloları mevcut kurala (eşik 10, haftada 1 freeze) göredir.

### 6.3. Kitap ve Quiz

Casual okur 90 günde ortalama 2,8 kitap bitirir (yaklaşık ayda 1 kitap, 200 sayfalık kitaplarla); Regular ~6,7 (ayda ~2), Hardcore ~13,2 (ayda ~4). Bitirilen kitap sayısı simülasyonda okunan sayfa sayısıyla tutarlıdır.

---

## 7. Enflasyon ve Anti-Exploit Analizi

* **Günlük okuma XP sınırı:** Taban 200 + hedef 15 + streak ≤ 50 = en fazla **265 XP/gün**. Azalan verim sayesinde 1.000 sayfa okuyan bir bot bile 200 taban XP'yi aşamaz; tavana 500 sayfada ulaşılır.
* **Bölünmeden bağımsızlık:** Sayfaları küçük oturumlara bölmek veya birleştirmek XP'yi değiştirmez (Bölüm 3.4); yuvarlama açığı yoktur.
* **Kitap ödülü:** Kitap başına en fazla 200 XP ve kullanıcı başına kitap başına bir kez (`UNIQUE(user_id, book_id)`). Sayfa sayısı istemciden değil, sunucudaki kitap kataloğundan alınır.
* **Quiz ödülü:** Quiz başına yalnızca ilk deneme XP verir (`UNIQUE(user_id, quiz_id)`).
* **İstemci verisi:** Günlük hedef, saat ve saat dilimi sunucudan gelir; istemciden alınmaz.
* **Kalan risk:** Kimlik/otomasyon ve sahte kitap girişleri tek başına bu kurallarla çözülmez; istek hızı sınırlaması ve katalog doğrulaması Backend ekibiyle belirlenmelidir. Bu rapor "enflasyon kesinlikle engellendi" iddiasında bulunmaz; yalnızca yukarıdaki üst sınırları garanti eder.

---

## 8. Bilinen Sınırlamalar

1. **Persona parametreleri varsayımdır.** Simülasyon, gerçek verilerle doğrulama değil, **senaryo analizidir**. Uygulama yayına alındığında gerçek okuma dağılımlarıyla yeniden kalibre edilmelidir.
2. Simülatör günde **tek oturum** üretir; çoklu oturum davranışı birim testlerle (Bölüm 3.4) doğrulanmıştır ama simülasyonda yoktur.
3. Saat dilimi, gece kuşu toleransı ve gün sınırları simülatörde modellenmez; yalnızca sözleşmede ve backend akışında tanımlıdır.
4. Günlük XP tam sayıya **aşağı yuvarlanır**; bu nedenle 101. sayfanın getirdiği 0,5 XP, o gün başka sayfa gelmedikçe görünmez. Bu bilinçli bir sadelik tercihidir.
5. Seviye unvanları ve liderlik tablosu kuralları bu çalışmanın kapsamı dışındadır.
