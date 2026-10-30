# Ayraç (web)

Kitap özetleri, sohbetler, meydan okuma soruları, düello ve rozetlerle bir okuma platformu. BookReads takımının **Yapay Zekâ Destekli Geliştirme** dersi projesinin web uygulaması.

> Bu klasör, takım reposunun içinde bağımsız çalışan bir Next.js uygulamasıdır. Geliştirme sürecinin adım adım anlatımı [docs/SUREC.md](docs/SUREC.md) dosyasındadır.

## Çalıştırma

Gereken: Node.js 18.18 veya üstü (22 LTS önerilir). Komutlar **bu klasörde (`web/`)** çalıştırılır; repo kökünde `package.json` yoktur. Repoyu ZIP olarak indirdiyseniz önce açılan klasörün içindeki `web` klasörüne girin.

```bash
cd web                               # repo kökündeyseniz
npm install
npm run admin:kur -- kullanici-adi   # yönetici hesabını kurar, güçlü bir şifre üretip ekrana yazar
npm run dev
```

- Site: http://localhost:3000
- Giriş / üye ol: http://localhost:3000/giris
- Yönetim paneli: http://localhost:3000/yonetim

Yönetici şifresi `.env.local` dosyasında yalnızca özet (hash) olarak durur ve bu dosya repoya yüklenmez. Şifreyi değiştirmek için `admin:kur` komutunu tekrar çalıştırıp sunucuyu yeniden başlatın.

## Kullanılan araçlar

| Alan | Araç |
| --- | --- |
| Çatı | Next.js 15 (App Router), React 19, TypeScript |
| Stil | Tailwind CSS 4 (tüm renkler ve iki tema `app/globals.css` içinde) |
| Animasyon | Motion (`motion/react`), saf CSS animasyonları, canvas-confetti |
| İkonlar | lucide-react |
| Çizimler | Elle yazılmış SVG (maskot ve kitap kapakları, görsel dosyası yok) |
| Güvenlik | Node.js `crypto` (scrypt, rastgele oturum anahtarları), nonce'lu CSP |
| Test | Node.js ile yazılmış uçtan uca test betiği (`tests/e2e.mjs`) |
| **Yapay zekâ** | **Claude Code (Anthropic)**: kodlama asistanı |

### Yapay zekâ nasıl kullanıldı?

Ders kapsamında geliştirme, **Claude Code** ile yapay zekâ destekli olarak yapıldı. İş bölümü şöyleydi:

- **Takım üyesi (insan):** Ne yapılacağına, tasarımın yönüne, önceliklere ve kabul kararlarına karar verdi. Örnekler: "daha samimi bir ton", "şifre girilirken komik bir animasyon", "quiz kesintisiz ilerlesin". Sonuçları kontrol edip hata bildirdi, örneğin maskotun yanındaki görsel bozukluğu fark etti.
- **Yapay zekâ:** Önerilen çözümü planladı, kodu yazdı, güvenlik önlemlerini tasarladı, testleri yazıp çalıştırdı. Bulduğu hataları düzeltti ve süreci belgeledi.
- Önemli kararlarda (üyelik bilgileri, misafirlerin yetkileri, GitHub iş akışı) seçenekler sunuldu ve karar takım üyesine bırakıldı.

Yapay zekânın birlikte yazdığı commit'lerde `Co-Authored-By: Claude` satırı bulunur.

## Özellikler

- **Kitaplar:** Kısa özet, ana fikirler ve sohbet sekmesi. Kategoriye göre filtreleme ve arama.
- **Meydan okuma:** Süreli sorular. Doğru şık yeşil, yanlış şık kırmızı yanar ve sonraki soruya kendiliğinden geçilir. Puan, seri ve rozetler sunucuda hesaplanır.
- **Düello:** Aynı sorular, aynı anda. Rakip şimdilik bilgisayar.
- **Üyelik:** "Sayfa çeviren" giriş ekranı:
  - Maskot kullanıcı adını defterine yazar.
  - Şifre girilirken sayfanın arkasına saklanır.
  - "Şifreyi göster"e basınca sayfanın köşesini kıvırıp gizlice bakar.
  - Şifre güçlendikçe sayfayı mühürler.
- **Profil, sıralama, ayarlar:**
  - Açık, koyu ve sistem teması.
  - "Animasyonları azalt" seçeneği.
  - Avatar rengi ve simgesi.
- **Yönetim paneli:** Kitap, soru, yorum ve üye yönetimi. Güvenlik kayıtları ve açık oturumlar.

Ziyaretçiler siteyi gezip özetleri okuyabilir. **Meydan okuma, düello ve yorum için üyelik gerekir.**

## Klasör yapısı

```
app/
  (auth)/          Giriş ve üye ol ekranı (kitap + maskot); actions.ts: giriş/kayıt/çıkış
  (site)/          Herkese açık sayfalar (ana sayfa, kitaplar, meydan okuma, düello, sıralama, profil, ayarlar)
  yonetim/         Yönetim paneli; actions.ts: panel eylemleri (hepsi oturum kontrolü yapar)
  actions.ts       Quiz turu, yorum ve profil eylemleri (üye oturumu ister)
components/        Arayüz bileşenleri (auth/: giriş ekranı, admin/: panel)
lib/
  server/          SADECE SUNUCU: veri deposu, kimlik doğrulama, quiz, doğrulama, hız sınırı
  data/            İlk kurulum verisi (kitaplar, sorular, cevaplar, rozetler)
  password-strength.ts, safe-redirect.ts, settings.ts   Hem tarayıcı hem sunucuda kullanılan kurallar
middleware.ts      Her istekte CSP nonce'u ve panel yönlendirmesi
scripts/           Yönetici hesabı kurulumu
tests/             Uçtan uca testler
docs/SUREC.md      Geliştirme süreci
```

Veriler şimdilik `data/ayrac-db.json` dosyasında tutulur. Dosya ilk açılışta `lib/data` içindeki verilerden oluşur ve repoya yüklenmez.

## Güvenlik

- **Şifreler:** scrypt ile özetlenir, düz metin hiçbir yerde saklanmaz. Üye şifresi en az 10 karakter olmalı. Yaygın şifreler, sadece rakamdan oluşan ve kullanıcı adını içeren şifreler reddedilir.
- **Oturumlar:** 256 bit rastgele anahtar. Sunucuda yalnızca SHA-256 özeti tutulur.
  - Yönetici çerezi: `SameSite=Strict`.
  - Üye çerezi: `SameSite=Lax`.
  - İkisi de `HttpOnly`; canlıda `Secure` ve `__Host-` önekli.
  - Yönetici ve üye oturumları birbirinden tamamen ayrıdır.
- **Kaba kuvvet ve hesap tespiti:** Hatalı girişler IP, kullanıcı adı ve toplam sayıya göre sınırlanır. Hata mesajı hesabın var olup olmadığını belli etmez.
- **Yetki:** Her panel sayfası ve eylemi oturumu sunucuda yeniden doğrular. Quiz ve yorum eylemleri üye oturumu ister.
- **Hile koruması:** Doğru cevaplar tarayıcıya hiç gönderilmez. Süre sunucu saatiyle ölçülür, puanı sunucu hesaplar. Sıra atlanamaz ve aynı soru iki kez puanlanmaz.
- **XSS:** Nonce tabanlı CSP ve React'in otomatik kaçışlaması. Stile giren değerler (ör. renkler) yalnızca izin verilen biçimde kabul edilir.
- **CSRF ve yönlendirme:** Başka sitelerden gelen form gönderimleri reddedilir. Giriş sonrası yalnızca site içi adreslere yönlendirilir.
- **Güvenlik başlıkları:** X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP; canlıda HSTS.

## Testler

Uçtan uca testler gerçek HTTP istekleriyle siteyi dener: güvenlik başlıkları, kayıt ve giriş kuralları, hile denemeleri, yetki ayrımı, yönetim paneli ve kaba kuvvet koruması. **Son çalıştırma: 63 testin 63'ü geçti.**

```bash
npm run test:e2e
```

Tek komut yeter; sunucuyu elle açmanız ve şifre girmeniz gerekmez. `tests/run-e2e.mjs` testi yalıtılmış bir ortamda çalıştırır:

- Boş, geçici bir veri klasörü ve test için üretilmiş ayrı bir yönetici hesabı kullanılır. Gerçek `data/` klasörüne ve `.env.local` içindeki yöneticiye dokunulmaz.
- Boş bir port ve ayrı derleme klasörü (`.next-e2e`) ile yeni bir sunucu açılır; `npm run dev` açıkken de çalışır. Hız sınırları her çalıştırmada sıfırdan başlar.
- Test bitince sunucu kapatılır ve geçici klasör silinir. `tests/e2e.mjs` doğrudan çalıştırılırsa gerçek veriyi korumak için reddedilir.
- Son adımda kaba kuvvet korumasını denediği için test sunucusunda admin girişi kilitlenir; bu yalnızca o geçici sunucuyu etkiler.

Tip denetimi: `npm run typecheck`

## Bilinen sınırlar

- E-posta doğrulama ve "şifremi unuttum" için bir e-posta servisi gerekiyor.
- Düellodaki rakip şimdilik bilgisayar.
- Veriler JSON dosyasında tutuluyor; canlıya çıkmadan önce gerçek bir veritabanına (ör. PostgreSQL) geçilmeli. `lib/server/db.ts` tek giriş noktası olduğu için sayfalar değişmez.
- Hız sınırı bellekte tutulduğu için tek sunucu için geçerli.
- Canlıya çıkarken HTTPS ve önünde bir ters vekil (reverse proxy) gerekir.
