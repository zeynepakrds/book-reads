# Geliştirme süreci

Bu belge, Ayraç web uygulamasının nasıl geliştirildiğini adım adım anlatır: hangi istek geldi, ne yapıldı, neden öyle yapıldı. Geliştirme bir takım üyesi ile yapay zekâ kodlama asistanı **Claude Code** birlikte çalışarak yapıldı. İstekleri ve kararları takım üyesi verdi; planlama, kodlama, test ve belgelemeyi yapay zekâ üstlendi.

---

## 0. Başlangıç noktası

Proje, örnek verilerle çalışan bir Next.js ön yüzü olarak başladı:
- Kitap listesi, kitap detayı, meydan okuma, düello, sıralama ve profil sayfaları vardı.
- Doğru cevaplar zaten sunucuda tutuluyordu; puan ise tarayıcıda hesaplanıyordu (bilinen açık olarak not edilmişti).
- Veritabanı, giriş sistemi ve yönetim paneli yoktu.

## 1. Projenin incelenmesi

**İstek:** Projeyi tanıt: klasör yapısı nasıl, hangi sayfalar var?
**Yapılan:** Tüm kod okundu; sayfalar, bileşenler ve veri yapısı çıkarıldı. Güvenlik açısından iyi olanlar (doğru cevapların tarayıcıya gitmemesi) ve eksikler (puanın tarayıcıda hesaplanması) not edildi.

## 2. Tasarım yenileme, admin paneli ve güvenlik altyapısı

**İstek:**
- Site daha samimi ve renkli olsun.
- Animasyonlar kaliteli olsun; mümkünse bir 2D çizim ya da banner olsun.
- Açık/koyu tema gelsin.
- "Profilim" yerine profil görseli ve açılır menü olsun.
- Kullanıcı adı ve şifre isteyen, sade bir admin paneli yapılsın.
- **Sistem baştan güvenli olsun.**

**Yapılanlar ve gerekçeleri:**
- **Tasarım sistemi:** Tüm renkler CSS değişkenlerine taşındı (`app/globals.css`). Böylece açık/koyu tema tek bir yerden değişiyor. Krem kâğıt zemin, sıcak vurgu renkleri ve basınca "gömülen" tombul butonlar eklendi.
- **Maskot:** Logodaki kitap ayracı biçiminden bir karakter çizildi (SVG, görsel dosyası yok). Ana sayfada açık bir kitabın içinden el sallıyor, göz kırpıyor, gözleriyle fareyi takip ediyor.
- **Animasyonlar:** Sayfa geçişleri, kaydırınca beliren bölümler, rafa düşen kitaplar ve quizde uçan puan eklendi. Sistemdeki "hareketi azalt" ayarına ve sitedeki "Animasyonları azalt" seçeneğine uyuyorlar.
- **Ayarlar sayfası ve profil menüsü:** Görünen ad, avatar rengi ve simgesi, tema seçimi.
- **Veri katmanı:** Örnek veriler sunucuda tek bir veri dosyasına taşındı (`lib/server/db.ts`). Yazmalar sıraya alınıyor ve önce geçici dosyaya yazılıyor; böylece dosya bozulmuyor. İleride veritabanına geçişte yalnızca bu dosya değişecek.
- **Güvenlik altyapısı:**
  - Nonce tabanlı İçerik Güvenliği Politikası (CSP) ve güvenlik başlıkları eklendi.
  - Tüm form girdileri sunucuda doğrulanıyor.
  - Hız sınırlayıcı eklendi.
  - Hata sayfaları teknik ayrıntı göstermiyor.
- **Admin paneli (`/yonetim`):**
  - Şifre scrypt özeti olarak `.env.local` dosyasında duruyor; kurulumu `npm run admin:kur` komutuyla yapılıyor.
  - Oturum anahtarının sunucuda yalnızca özeti tutuluyor.
  - Hatalı girişler sınırlanıyor ve kayda geçiyor.
  - Kitap, soru ve yorum yönetimi var; ayrıca güvenlik kayıtları ve açık oturumlar sayfası.
- **Doğrulama:** Gerçek HTTP istekleriyle 28 güvenlik testi yazıldı (oturumsuz silme, sahte çerez, CSRF, XSS, kaba kuvvet...). Hepsi geçti.

## 3. Admin hesabının düzenlenmesi

**İstek:** Admin kullanıcı adı değiştirilsin, şifre geliştirme süresince basit kalsın.
**Yapılan:** Kurulum betiğine yalnızca yerel geliştirme için açıkça yazılması gereken bir `--zayif` seçeneği eklendi. Normal kullanımda 12 karakterden kısa şifre hâlâ reddediliyor; böylece kısa şifre yanlışlıkla canlıya geçemez. Canlıya çıkmadan önce şifrenin değiştirilmesi not edildi.

## 4. Üyelik sistemi ve "sayfa çeviren" giriş ekranı

**İstek:** Kullanıcıların giriş yapıp üye olabileceği, "akılları gitsin" denecek kadar güzel bir ekran. Örnek olarak, şifre girilirken gözlerini kapatan bir karakter verildi; daha orijinal bir fikir istendi.

**Önerilen ve seçilen fikir:** Site adı "Ayraç" olduğu için ekran **açık bir kitap** olarak tasarlandı.
- Sol sayfada maskot, sağ sayfada form duruyor. Giriş ↔ Üye ol geçişinde sağ sayfa 3D olarak çevriliyor.
- Kitabın üstünden sarkan iki kurdele (ayraç) sekme görevi görüyor.

Maskotun tepkileri:
| Durum | Maskotun tepkisi |
| --- | --- |
| Kullanıcı adı yazılırken | Adı defterine yazar, gözleri yazıyı takip eder |
| Şifre alanında | Üzerinde "ÇOK GİZLİ" damgası olan bir sayfanın arkasına saklanır; şifre sayfada yalnızca nokta olarak görünür |
| "Şifreyi göster" | Sayfanın köşesini kıvırıp tek gözle gizlice bakar, yanakları kızarır |
| Şifre güçlendikçe | Sayfaya kilitler, en sonda altın mühür eklenir; zayıf şifrede terler |
| Caps Lock açık | "Psst! Büyük harf kilidi açık." |
| Hatalı giriş | Başını sallar, alan titrer |
| Başarılı giriş | Zıplar, konfeti patlar, "Hoş geldin!" der |

**Takım üyesinin kararları:**
- Ziyaretçiler siteyi gezip özetleri okuyabilir; **quiz, düello ve yorum için üyelik şart.**
- Üye olurken kullanıcı adı, e-posta ve şifre istenir.

**Güvenlik kararları:**
- Üye oturumları admin oturumlarından tamamen ayrı tutuldu: farklı çerez ve farklı oturum listesi.
- Şifre kuralları güncel önerilere (NIST 800-63B) göre belirlendi:
  - Uzunluk esas alındı.
  - Yaygın şifreler ve kişisel bilgi içeren şifreler yasaklandı.
- Giriş hatası, hesabın var olup olmadığını belli etmiyor.
- Giriş sonrası yönlendirme yalnızca site içi adreslere yapılıyor.

**README'deki bilinen açığın kapatılması:** Puan hesabı sunucuya taşındı.
- Tur sunucuda açılıyor ve süre sunucu saatiyle ölçülüyor.
- Sıra atlanamıyor, aynı soru iki kez puanlanamıyor.
- XP, seri ve rozetler hesaba sunucuda yazılıyor.

**Admin paneline eklenen:** Üyeler sayfası (listeleme, oturumlarını kapatma, hesap silme).

**Test sırasında bulunan gerçek bir zayıflık:** `123456789012` gibi yalnızca rakamdan oluşan şifreler başta kabul ediliyordu. Kural genişletildi:
- 16 haneden kısa ve yalnızca rakamdan oluşan şifreler reddediliyor.
- Kısa parçaların tekrarı ve klavye dizileri (`qwertyuiop` gibi) reddediliyor.

## 5. Kullanıcı geri bildirimiyle düzeltilen hatalar

1. **Maskotun yanında bozuk görünen küçük bir parça** (takım üyesi fark etti).
   - **Sebep:** Parıltı yıldızlarının SVG'deki konumunu, yanıp sönme animasyonunun CSS `transform` değeri eziyordu. Yıldızlar çizimin sol üst köşesine kayıp kesik görünüyordu.
   - **Düzeltme:** Konum dış gruba, animasyon iç şekle verildi. Aynı hata ana sayfa çiziminde de vardı, o da düzeltildi.
2. **Soru ekranında sayfanın aşağı kayması.**
   - **Sebep:** Cevaptan sonra "Sonraki soru" düğmesine odaklanmak sayfayı aşağı kaydırıyordu; yeni soruda da sayfa aşağıda kalıyordu.
   - **İlk düzeltme:** Süre ve puan için sabit bir üst şerit eklendi, sonuç şıkkın üzerinde gösterildi.
   - **Takım üyesinin ikinci isteği:** Hiç kesinti olmasın.
   - **Son hali:** Cevaptan sonra doğru şık yeşil, yanlış şık kırmızı yanıyor ve 1–1,6 saniye sonra sonraki soruya kendiliğinden geçiliyor. Açıklama paneli ve "İlerle" düğmesi kaldırıldı.

## 6. GitHub'a taşıma

**İstek:** Hoca süreci GitHub'dan takip edecek; README ve commit'ler önemli. Yapay zekâ kullanımı açıkça belirtilsin. Yalnızca site dosyaları paylaşılsın.

**Yapılanlar:**
- **Ekip kurallarına uyum:** Takımın reposundaki kurallara uyuldu: `main` sabit kalıyor, iş ayrı bir dalda (`feature/ayrac-web`) yapılıyor ve değişiklik bir Pull Request ile, başka bir üyenin incelemesine sunuluyor.
- **Klasör düzeni:** Uygulama, takımın kökteki dosyalarıyla çakışmaması için `web/` klasörüne taşındı.
- **Kalıcı testler:**
  - Geçici test betikleri tek bir kalıcı test dosyasında toplandı (`tests/e2e.mjs`).
  - Admin bilgileri koda yazılmıyor, ortam değişkenlerinden okunuyor.
  - Test, oluşturduğu deneme hesaplarını sonunda kendisi siliyor.
  - **Sonuç: 62 testin 62'si geçti.**
- **Repoya girmeyenler:** `.env.local` (şifre özeti), `data/` (üye verileri), `node_modules/` ve derleme çıktıları.

## Sıradaki adımlar

Takım üyesinin seçtiği, sırasıyla yapılacak işler:
1. Rozet bildirimleri
2. Sesli özet (tarayıcının Türkçe sesiyle)
3. Daha iyi yorumlar: kalıcı beğeni, yanıt, "sürpriz bozan" etiketi, şikâyet
4. Herkese açık okur profilleri
5. Sana özel kitap önerileri
6. Günün sorusu ve günlük seri
7. Gerçek zamanlı düello: iki gerçek oyuncu
