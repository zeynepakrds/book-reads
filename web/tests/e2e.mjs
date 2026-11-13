// Ayraç uçtan uca testleri: güvenlik, üyelik, quiz ve yönetim paneli.
//
// Çalıştırma (web/ klasöründe, başka bir şey açmaya gerek yok):
//   npm run test:e2e
//
// `tests/run-e2e.mjs` testi YALIN bir ortamda çalıştırır: boş geçici veri
// klasörü, kendi test yöneticisi, boş bir port ve taze bir sunucu. Gerçek
// `data/` klasörüne ve gerçek yönetici hesabına hiç dokunulmaz; hız sınırları
// da her çalıştırmada sıfırdan başlar. Bu dosya doğrudan çalıştırılırsa
// reddedilir (E2E_ISOLATED=1 yalnızca o betik tarafından verilir).

import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_USER = process.env.ADMIN_TEST_USER;
const ADMIN_PASS = process.env.ADMIN_TEST_PASS;
const DIST_DIR = process.env.AYRAC_DIST_DIR ?? ".next";

if (process.env.E2E_ISOLATED !== "1") {
  console.error("Bu test gerçek veriyi silebilir. `npm run test:e2e` ile çalıştırın (yalıtılmış ortam kurar).");
  process.exit(2);
}

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  cond ? pass++ : fail++;
  console.log(`${cond ? "GEÇTİ " : "KALDI!"}  ${msg}`);
};
const section = (title) => console.log(`\n— ${title} —`);

// Sunucu eylemlerinin kimlikleri derleme çıktısından okunur (sayfalar açıldıkça dolar).
function actionId(name) {
  const file = new URL(`../${DIST_DIR}/server/server-reference-manifest.json`, import.meta.url);
  const manifest = JSON.parse(readFileSync(file, "utf8")).node;
  const found = Object.entries(manifest).find(([, v]) => v.exportedName === name);
  if (!found) throw new Error(`Sunucu eylemi bulunamadı: ${name} (ilgili sayfa henüz derlenmemiş olabilir)`);
  return found[0];
}

const strip = (html) => html.replace(/<!-- -->/g, "");
const decode = (v) => (v ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

/** JavaScript'siz bir tarayıcı gibi formu gönderir (React'in gizli eylem alanlarıyla). */
async function submitForm(path, fields, cookie, origin = BASE) {
  const html = await (await fetch(`${BASE}${path}`, { headers: cookie ? { Cookie: cookie } : {} })).text();
  const fd = new FormData();
  for (const m of html.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g)) {
    if (m[1].startsWith("$ACTION")) fd.append(m[1], decode(m[2]));
  }
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    body: fd,
    redirect: "manual",
    headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
  });
  return { status: r.status, cookie: r.headers.get("set-cookie") ?? "", location: r.headers.get("location"), html: await r.text() };
}

/** Bağlanmamış (bound olmayan) bir eylemi form gibi çağırır: <form action={eylem}> */
async function postAction(name, path, fields, cookie) {
  const fd = new FormData();
  fd.append(`$ACTION_ID_${actionId(name)}`, "");
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const r = await fetch(`${BASE}${path}`, { method: "POST", body: fd, redirect: "manual", headers: { Origin: BASE, Cookie: cookie } });
  return r.status;
}

/** İstemciden çağrılan bir sunucu eylemi (JSON argümanlarla). */
async function callAction(name, args, cookie, page = "/") {
  const r = await fetch(`${BASE}${page}`, {
    method: "POST",
    headers: {
      "Next-Action": actionId(name),
      "Content-Type": "text/plain;charset=UTF-8",
      Origin: BASE,
      Accept: "text/x-component",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(args),
  });
  return r.text();
}

const userJar = (setCookie) => (setCookie.match(/ayrac-oturum=[A-Za-z0-9_-]{43}/) ?? [""])[0];
const adminJar = (setCookie) => (setCookie.match(/ayrac-yonetim=[A-Za-z0-9_-]{43}/) ?? [""])[0];

// Sayfaları bir kez açarak derlenmelerini sağla.
for (const p of ["/", "/giris", "/uye-ol", "/kitaplar/simyaci", "/meydan-okuma/simyaci", "/arkadaslar", "/yonetim/giris"]) {
  await fetch(`${BASE}${p}`, { redirect: "manual" });
}

/* ================================ Genel ================================ */
section("Genel güvenlik");

const home = await fetch(`${BASE}/`);
const csp = home.headers.get("content-security-policy") ?? "";
ok(home.status === 200, "Ana sayfa açılıyor");
ok(/script-src[^;]*'nonce-/.test(csp) && csp.includes("frame-ancestors 'none'"), "CSP nonce ile ve iframe'e kapalı");
ok(home.headers.get("x-frame-options") === "DENY" && home.headers.get("x-content-type-options") === "nosniff", "X-Frame-Options ve nosniff başlıkları var");
ok(!home.headers.get("x-powered-by"), "Sunucu teknolojisini ele veren X-Powered-By başlığı yok");

const bookHtml = await (await fetch(`${BASE}/kitaplar/simyaci`)).text();
ok(!bookHtml.includes('"correct"') && !bookHtml.includes("explanation"), "Kitap sayfasında doğru cevap bilgisi yok");

for (const p of ["/meydan-okuma/simyaci", "/duello"]) {
  const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
  ok(r.status === 307 && (r.headers.get("location") ?? "").startsWith("/giris?sonra="), `Misafir ${p} → giriş sayfasına yönlendi`);
}
const adminRedirect = await fetch(`${BASE}/yonetim/kitaplar`, { redirect: "manual" });
ok(adminRedirect.status === 307 && adminRedirect.headers.get("x-robots-tag")?.includes("noindex"), "Oturumsuz yönetim sayfası → giriş, arama motorlarına kapalı");

/* =============================== Üyelik =============================== */
section("Üyelik");

const RUN = Date.now().toString(36).slice(-6);
const USER = `test.okur${RUN}`;
const EMAIL = `test${RUN}@ornek.com`;
const PASS = "Kitap-Kurdu-2026!";

let r = await submitForm("/uye-ol", { kullanici: USER, eposta: EMAIL, sifre: "123456789012", kurallar: "on", sonra: "/" });
ok(!userJar(r.cookie) && r.html.includes("yaygın"), "Sadece rakamdan oluşan şifre reddedildi");
r = await submitForm("/uye-ol", { kullanici: USER, eposta: EMAIL, sifre: `${USER}2026xx`, kurallar: "on", sonra: "/" });
ok(!userJar(r.cookie) && r.html.includes("kullanıcı adını"), "Kullanıcı adını içeren şifre reddedildi");
r = await submitForm("/uye-ol", { kullanici: "admin", eposta: `a${EMAIL}`, sifre: PASS, kurallar: "on", sonra: "/" });
ok(!userJar(r.cookie) && r.html.includes("kullanılamaz"), "Ayrılmış kullanıcı adı (admin) alınamadı");
r = await submitForm("/uye-ol", { kullanici: USER, eposta: "bozuk-eposta", sifre: PASS, kurallar: "on", sonra: "/" });
ok(!userJar(r.cookie) && r.html.includes("Geçerli bir e-posta"), "Geçersiz e-posta reddedildi");
r = await submitForm("/uye-ol", { kullanici: USER, eposta: EMAIL, sifre: PASS, sonra: "/" });
ok(!userJar(r.cookie), "Kurallar kabul edilmeden kayıt olunamadı");

r = await submitForm("/uye-ol", { kullanici: USER, eposta: EMAIL, sifre: PASS, kurallar: "on", sonra: "/" });
let jar = userJar(r.cookie);
ok(Boolean(jar), "Geçerli bilgilerle kayıt olundu");
ok(/HttpOnly/i.test(r.cookie) && /SameSite=lax/i.test(r.cookie), "Üye çerezi HttpOnly + SameSite=Lax");
r = await submitForm("/uye-ol", { kullanici: USER, eposta: `x${EMAIL}`, sifre: PASS, kurallar: "on", sonra: "/" });
ok(!userJar(r.cookie) && r.html.includes("alınmış"), "Aynı kullanıcı adıyla ikinci kayıt engellendi");

r = await submitForm("/giris", { kimlik: USER, sifre: "yanlis-sifre-123", sonra: "/" });
ok(!userJar(r.cookie) && r.html.includes("hatalı"), "Yanlış şifreyle giriş reddedildi");
r = await submitForm("/giris", { kimlik: "olmayan.kisi", sifre: PASS, sonra: "/" });
ok(!userJar(r.cookie) && r.html.includes("Kullanıcı adı ya da şifre hatalı"), "Olmayan kullanıcıda aynı hata mesajı (hesap var mı anlaşılmıyor)");
r = await submitForm("/giris", { kimlik: EMAIL.toUpperCase(), sifre: PASS, sonra: "/" });
ok(Boolean(userJar(r.cookie)) && !/Max-Age/i.test(r.cookie), "E-postayla giriş; 'beni hatırla' yoksa çerez tarayıcı kapanınca silinir");
r = await submitForm("/giris", { kimlik: USER, sifre: PASS, hatirla: "on", sonra: "/" });
ok(/Max-Age=2592000/.test(r.cookie), "'Beni hatırla' ile çerez 30 gün");
jar = userJar(r.cookie);

for (const target of ["//kotu-site.example", "https://kotu-site.example"]) {
  const e = await fetch(`${BASE}/giris?sonra=${encodeURIComponent(target)}`, { headers: { Cookie: jar }, redirect: "manual" });
  ok(e.headers.get("location") === "/", `?sonra=${target} → site dışına yönlendirilmedi`);
}

const quizPage = await fetch(`${BASE}/meydan-okuma/simyaci`, { headers: { Cookie: jar }, redirect: "manual" });
const quizHtml = await quizPage.text();
ok(quizPage.status === 200 && !quizHtml.includes('"correct"') && !quizHtml.includes("explanation"), "Üye quiz sayfasını açtı; sayfada doğru cevap yok");
ok((await fetch(`${BASE}/yonetim`, { headers: { Cookie: jar }, redirect: "manual" })).status === 307, "Üye çerezi yönetim paneline yetki vermedi");

section("Quiz (puan sunucuda)");

let t = await callAction("startQuiz", ["simyaci", "tek"]);
ok(t.includes('"needLogin":true'), "Misafir tur başlatamadı");
t = await callAction("startQuiz", ["simyaci", "tek"], jar);
const attemptId = (t.match(/"attemptId":"(t-[0-9a-f]{12})"/) ?? [])[1];
const qids = [...t.matchAll(/"id":"(simyaci-[^"]+)"/g)].map((m) => m[1]);
ok(Boolean(attemptId) && qids.length === 4 && !t.includes('"correct"'), `Üye tur başlattı (${qids.length} soru, cevaplar gönderilmedi)`);

const correct = { "simyaci-1": 0, "simyaci-2": 1, "simyaci-3": 2, "simyaci-4": 3 };
ok((await callAction("answerQuestion", [attemptId, qids[2], 0], jar)).includes("Soru sırası"), "Sıra atlanarak cevap verilemedi");
const a1 = await callAction("answerQuestion", [attemptId, qids[0], correct[qids[0]]], jar);
const pts = Number((a1.match(/"points":(\d+)/) ?? [])[1]);
ok(a1.includes('"correct":true') && pts >= 130, `Doğru cevabın puanı sunucuda hesaplandı (+${pts})`);
const again = await callAction("answerQuestion", [attemptId, qids[0], correct[qids[0]]], jar);
ok(again.includes("zaten cevaplandı") || again.includes("Soru sırası"), "Aynı soru ikinci kez puanlanmadı");
ok((await callAction("answerQuestion", [attemptId, qids[1], correct[qids[1]]], jar)).includes("zaten cevaplandı"), "Sonraki soru açılmadan cevap verilemedi");
let last = "";
for (let i = 1; i < qids.length; i++) {
  await callAction("nextQuestion", [attemptId], jar);
  last = await callAction("answerQuestion", [attemptId, qids[i], correct[qids[i]]], jar);
}
const xp = Number((last.match(/"xpGained":(\d+)/) ?? [])[1]);
ok(last.includes('"done":true') && xp > 0, `Tur bitti, hesaba +${xp} XP yazıldı`);
ok(last.includes('"id":"ilk-sayfa"') && last.includes('"id":"kusursuz"'), "Rozetler sunucuda verildi");
const profile = strip(await (await fetch(`${BASE}/profil`, { headers: { Cookie: jar } })).text());
ok(profile.includes(`@${USER}`) && profile.includes("Kusursuz"), "Profil gerçek üye verisini gösteriyor");
ok((await (await fetch(`${BASE}/siralama`)).text()).includes(USER), "Üye sıralamada görünüyor");

section("Yorum ve profil");

let c = await callAction("postComment", [{ bookSlug: "simyaci", text: "misafir yorumu" }]);
ok(c.includes('"needLogin":true'), "Misafir yorum yazamadı");
c = await callAction("postComment", [{ bookSlug: "simyaci", text: "Çok sevdim <script>alert(1)</script>", name: "Sahte Ad", color: "#000000" }], jar);
ok(c.includes('"ok":true') && c.includes(`"author":"${USER}"`) && !c.includes("Sahte Ad"), "Yorum yazarı hesaptan alındı, sahte ad yok sayıldı");
ok(!(await (await fetch(`${BASE}/kitaplar/simyaci`)).text()).includes("<script>alert(1)</script>"), "Yorumdaki <script> çalışır halde sayfaya girmedi");
ok((await callAction("updateProfile", [{ color: "red;background:url(x)" }], jar)).includes("Geçersiz renk"), "Stil enjeksiyonu denemesi (renk) reddedildi");
ok((await callAction("updateProfile", [{ displayName: "Test Okur", icon: "panda", color: "#13a08f" }], jar)).includes('"ok":true'), "Profil güncellendi");
ok((await (await fetch(`${BASE}/kitaplar/simyaci`)).text()).includes("Test Okur"), "Eski yorum yeni görünen adla gösteriliyor");
ok((await callAction("startQuiz", ["simyaci", "tek"], "ayrac-yonetim=" + "A".repeat(43))).includes('"needLogin":true'), "Yönetici çerezi üye yetkisi vermedi");

/* ============================== Arkadaşlık ============================== */
section("Arkadaşlık");

const USER2 = `test.dost${RUN}`;
const USER3 = `test.yabanci${RUN}`;
const reg = async (name) => {
  const x = await submitForm("/uye-ol", { kullanici: name, eposta: `${name.replace(/\./g, "")}@ornek.com`, sifre: PASS, kurallar: "on", sonra: "/" });
  return userJar(x.cookie);
};
const jar2 = await reg(USER2);
const jar3 = await reg(USER3);
ok(Boolean(jar2) && Boolean(jar3), "İki ek deneme üyesi kaydedildi");

const friendsHtml = async (cookie) => strip(await (await fetch(`${BASE}/arkadaslar`, { headers: { Cookie: cookie } })).text());
const reqId = (html) => (html.match(/f-[0-9a-f]{12}/) ?? [])[0];

const guestFriends = await fetch(`${BASE}/arkadaslar`, { redirect: "manual" });
ok(guestFriends.status === 200 && (await guestFriends.text()).includes("Üye ol"), "Misafir arkadaşlar sayfasında giriş çağrısı görüyor");
ok((await callAction("sendFriendRequest", [USER2])).includes('"needLogin":true'), "Misafir arkadaşlık isteği gönderemedi");
ok((await callAction("searchReaders", [USER2.slice(0, 6)])).includes("giriş yapmalısın"), "Misafir kullanıcı arayamadı");

ok((await callAction("sendFriendRequest", [USER], jar)).includes("Kendine"), "Kendine istek gönderilemedi");
ok((await callAction("sendFriendRequest", ["olmayan.okur.x"], jar)).includes("bulunamadı"), "Olmayan kullanıcıya istek gönderilemedi");
ok((await callAction("sendFriendRequest", ["../etc"], jar)).includes("Geçerli bir kullanıcı adı"), "Geçersiz kullanıcı adı reddedildi");

// jar → USER2 isteği
ok((await callAction("sendFriendRequest", [`@${USER2}`], jar)).includes('"ok":true'), "İstek gönderildi (@ önekiyle de çalışır)");
ok((await callAction("sendFriendRequest", [USER2], jar)).includes("zaten bir istek"), "Aynı kişiye ikinci istek engellendi");

const hit = await callAction("searchReaders", [USER2.slice(0, 8)], jar);
ok(hit.includes(`"username":"${USER2}"`) && hit.includes('"relation":"sent"') && !hit.includes("@ornek.com"), "Arama sonucu ilişkiyi gösteriyor, e-posta sızdırmıyor");

const inbox2 = await friendsHtml(jar2);
ok(inbox2.includes("Gelen istekler") && inbox2.includes(`@${USER}`), "Alıcı, isteği 'Gelen istekler'de görüyor");
// Not: kök layout, girişli üyenin KENDİ hesabını (kendi e-postası dahil) sayfaya verir. Önemli olan başkasınınkinin görünmemesi.
ok(!inbox2.includes(EMAIL) && !inbox2.includes("scrypt:"), "Sayfada başkasının e-postası ya da şifre özeti yok");
const fid = reqId(inbox2);
ok(Boolean(fid), "Arkadaşlık kimliği sayfada var");

// Yetkisiz işlemler
ok((await callAction("respondFriendRequest", [fid, true], jar)).includes("İstek bulunamadı"), "İsteği gönderen kendi isteğini kabul edemedi");
ok((await callAction("respondFriendRequest", [fid, true], jar3)).includes("İstek bulunamadı"), "Üçüncü kişi başkasının isteğini kabul edemedi");
ok((await callAction("cancelFriendRequest", [fid], jar3)).includes("İstek bulunamadı"), "Üçüncü kişi başkasının isteğini geri çekemedi");
ok((await callAction("respondFriendRequest", ["f-123", true], jar2)).includes("Geçersiz"), "Bozuk kimlik reddedildi");
ok(!(await friendsHtml(jar3)).includes(`@${USER}`), "Üçüncü kişi, başkasının isteğini sayfasında görmüyor");

// Reddet → kayıt silinir, yeniden istek gönderilebilir
ok((await callAction("respondFriendRequest", [fid, false], jar2)).includes('"ok":true'), "Alıcı isteği reddetti");
ok((await callAction("sendFriendRequest", [USER2], jar)).includes('"ok":true'), "Reddedilen istek sonrası yeniden istek gönderilebildi");

// Geri çek
const sentHtml = await friendsHtml(jar);
ok(sentHtml.includes("Gönderilen istekler"), "Gönderen, isteği 'Gönderilen istekler'de görüyor");
const fid2 = reqId(await friendsHtml(jar2));
ok((await callAction("cancelFriendRequest", [fid2], jar)).includes('"ok":true'), "Gönderen isteği geri çekti");
ok((await callAction("respondFriendRequest", [fid2, true], jar2)).includes("İstek bulunamadı"), "Geri çekilen istek kabul edilemedi");

// Karşılıklı istek → otomatik kabul
await callAction("sendFriendRequest", [USER2], jar);
const auto = await callAction("sendFriendRequest", [USER], jar2);
ok(auto.includes('"ok":true') && auto.includes("arkadaş oldunuz"), "Karşılıklı istek otomatik kabul edildi");
ok((await callAction("sendFriendRequest", [USER2], jar)).includes("Zaten arkadaşsınız"), "Arkadaşa tekrar istek gönderilemedi");

// Arkadaş istatistikleri ve son hareket (USER daha önce meydan okuma bitirmişti)
const mine2 = await friendsHtml(jar2);
ok(mine2.includes("Arkadaşlarım") && mine2.includes(`@${USER}`), "Arkadaş listede görünüyor");
ok(mine2.includes("Simyacı") && mine2.includes("4/4 doğru"), "Arkadaşın son okuma hareketi (kitap, doğru sayısı) görünüyor");
ok(!(await friendsHtml(jar3)).includes(`@${USER}`), "Arkadaş olmayan, başkasının arkadaş listesini göremiyor");

// Arkadaşlıktan çıkar
const friendId = reqId(mine2);
ok((await callAction("removeFriendship", [friendId], jar3)).includes("bulunamadı"), "Üçüncü kişi başkasının arkadaşlığını silemedi");
ok((await callAction("removeFriendship", [friendId], jar2)).includes('"ok":true'), "Arkadaşlıktan çıkıldı");
ok(!(await friendsHtml(jar)).includes(`@${USER2}`), "Çıkarılan kişi iki tarafta da listeden kalktı");

await callAction("logoutUser", [], jar2);
await callAction("logoutUser", [], jar3);

await callAction("logoutUser", [], jar);
ok((await callAction("startQuiz", ["simyaci", "tek"], jar)).includes('"needLogin":true'), "Çıkıştan sonra eski üye çerezi geçersiz");

/* ============================ Yönetim paneli ============================ */
section("Yönetim paneli");

if (!ADMIN_USER || !ADMIN_PASS) {
  ok(false, "ADMIN_TEST_USER / ADMIN_TEST_PASS verilmedi; yönetim paneli testleri çalışamadı");
} else {
  const anon = await postAction("deleteBookAction", "/yonetim/kitaplar", { slug: "1984" }, "");
  ok((await fetch(`${BASE}/kitaplar/1984`)).status === 200, `Oturumsuz kitap silme isteği işe yaramadı (yanıt ${anon})`);

  const bad = await submitForm("/yonetim/giris", { kullanici: ADMIN_USER, sifre: "yanlis-sifre-123" });
  ok(!adminJar(bad.cookie) && bad.html.includes("hatalı"), "Yanlış admin şifresi reddedildi");
  const csrf = await submitForm("/yonetim/giris", { kullanici: ADMIN_USER, sifre: ADMIN_PASS }, "", "https://kotu-site.example");
  ok(!adminJar(csrf.cookie), `Başka siteden gönderilen giriş formu reddedildi (durum ${csrf.status})`);

  const good = await submitForm("/yonetim/giris", { kullanici: ADMIN_USER, sifre: ADMIN_PASS });
  const admin = adminJar(good.cookie);
  ok(Boolean(admin) && good.location === "/yonetim", "Admin girişi başarılı");
  ok(/HttpOnly/i.test(good.cookie) && /SameSite=strict/i.test(good.cookie), "Admin çerezi HttpOnly + SameSite=Strict");

  for (const p of ["/yonetim", "/yonetim/kitaplar", "/yonetim/kitaplar/yeni", "/yonetim/kitaplar/1984", "/yonetim/sorular", "/yonetim/sorular/1984-1", "/yonetim/yorumlar", "/yonetim/uyeler", "/yonetim/guvenlik"]) {
    const res = await fetch(`${BASE}${p}`, { headers: { Cookie: admin }, redirect: "manual" });
    ok(res.status === 200, `Panel ${p} açıldı`);
  }
  const fakeBody = await (await fetch(`${BASE}/yonetim`, { headers: { Cookie: "ayrac-yonetim=" + "A".repeat(43) } })).text();
  ok(fakeBody.includes("Yönetici girişi"), "Sahte admin çereziyle panele girilemedi");

  const members = await (await fetch(`${BASE}/yonetim/uyeler`, { headers: { Cookie: admin } })).text();
  ok(!members.includes("scrypt:"), "Üyeler sayfasında şifre özeti yok");

  // Temizlik: SADECE bu çalıştırmanın açtığı deneme üyesini sil.
  // Her satır kendi <tr>...</tr> sınırı içinde incelenir; sayfanın sonundaki
  // veri betikleri ya da başka satırlar karıştırılmaz. Gerçek hesaplara dokunulmaz.
  const rowsOf = (html) =>
    [...html.matchAll(/<tr[\s>][\s\S]*?<\/tr>/g)].map((m) => m[0]);
  const testIds = new Set(
    rowsOf(members)
      .filter((row) => [USER, USER2, USER3].some((n) => strip(row).includes(`@${n}<`)))
      .map((row) => (row.match(/name="id" value="(u-[0-9a-f]{12})"/) ?? [])[1])
      .filter(Boolean),
  );
  ok(testIds.size === 3, `Silinecek hesaplar yalnızca bu testin açtığı hesaplar (${testIds.size})`);
  const before = rowsOf(members).length;
  for (const id of testIds) await postAction("deleteUserAction", "/yonetim/uyeler", { id }, admin);
  const afterHtml = await (await fetch(`${BASE}/yonetim/uyeler`, { headers: { Cookie: admin } })).text();
  ok(![USER, USER2, USER3].some((n) => strip(afterHtml).includes(`@${n}<`)) && rowsOf(afterHtml).length === before - testIds.size, "Deneme üyeleri silindi, diğer hesaplar yerinde");

  // Kaba kuvvet: farklı kullanıcı adıyla 7 hatalı deneme → engel
  let blocked = false;
  for (let i = 0; i < 7; i++) {
    const x = await submitForm("/yonetim/giris", { kullanici: "saldirgan", sifre: `deneme${i}` });
    if (x.html.includes("Çok fazla")) blocked = true;
  }
  ok(blocked, "Kaba kuvvet: 5 hatalı denemeden sonra giriş engellendi");
  const during = await submitForm("/yonetim/giris", { kullanici: ADMIN_USER, sifre: ADMIN_PASS });
  ok(!adminJar(during.cookie), "Engel süresince doğru şifre bile kabul edilmedi");

  await postAction("logoutAction", "/yonetim", {}, admin);
  const out = await (await fetch(`${BASE}/yonetim`, { headers: { Cookie: admin } })).text();
  ok(out.includes("Yönetici girişi"), "Çıkıştan sonra eski admin çerezi geçersiz");
}

console.log(`\n${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
