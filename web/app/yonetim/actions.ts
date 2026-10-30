"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categories } from "@/lib/categories";
import {
  adminConfigured,
  audit,
  createSession,
  destroyCurrentSession,
  destroyOtherSessions,
  getAdminSession,
  requireAdmin,
  verifyCredentials,
} from "@/lib/server/auth";
import { mutate, newId } from "@/lib/server/db";
import { check, consume, record, reset } from "@/lib/server/rate-limit";
import { clientIp } from "@/lib/server/request";
import { cleanText, Form, ID_RE, SLUG_RE } from "@/lib/server/validate";
import type { Book, CoverPattern } from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * Yönetim paneli sunucu eylemleri.
 *
 * GÜVENLİK: Bu dosyadaki her fonksiyon internetten çağrılabilir bir uç
 * noktadır. Bu yüzden `loginAction` dışındaki HER eylem ilk satırında
 * `requireAdmin()` çağırır; oturum yoksa hiçbir şey yapmadan giriş
 * sayfasına yönlendirir. Next.js ayrıca sunucu eylemlerinde istek kaynağını
 * (Origin) kontrol eder: başka bir siteden gelen sahte form gönderimleri
 * (CSRF) reddedilir. Oturum çerezi de SameSite=Strict'tir.
 */

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

const LOGIN_WINDOW = 15 * 60_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function snapshot(fd: FormData) {
  const values: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) values[k] = v.slice(0, 4000);
  }
  return values;
}

/* ----------------------------- Giriş / çıkış ----------------------------- */

export type LoginState = { error?: string; username?: string };

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!adminConfigured()) return { error: "Yönetici hesabı henüz kurulmamış." };

  const rawUser = fd.get("kullanici");
  const rawPass = fd.get("sifre");
  const username = cleanText(typeof rawUser === "string" ? rawUser : "").slice(0, 64);
  const password = typeof rawPass === "string" ? rawPass.slice(0, 256) : "";

  // Üç ayrı sınır: aynı IP'den, aynı kullanıcı adına ve toplamda yapılan hatalı denemeler.
  const ip = await clientIp();
  const limits = [
    { key: `giris:ip:${ip}`, max: 5 },
    { key: `giris:ad:${username.toLocaleLowerCase("tr")}`, max: 10 },
    { key: "giris:hepsi", max: 50 },
  ];
  const blocked = limits.map((l) => check(l.key, l.max, LOGIN_WINDOW)).find((r) => r.limited);
  if (blocked) {
    if (!consume(`giris:engel-kaydi:${ip}`, 1, LOGIN_WINDOW).limited) {
      await audit("giris-engellendi", `Deneme sınırı aşıldı (kullanıcı adı: ${username.slice(0, 40) || "boş"})`);
    }
    const minutes = Math.ceil(blocked.retryAfterMs / 60_000);
    return { error: `Çok fazla hatalı deneme yapıldı. ${minutes} dakika sonra tekrar dene.`, username };
  }

  if (!username || !password) return { error: "Kullanıcı adı ve şifre gerekli.", username };

  const ok = await verifyCredentials(username, password);
  if (!ok) {
    for (const l of limits) record(l.key);
    await audit("giris-basarisiz", `Hatalı giriş (kullanıcı adı: ${username.slice(0, 40)})`);
    // Rastgele kısa bekleme: otomatik deneme araçlarını yavaşlatır.
    await sleep(350 + Math.floor(Math.random() * 400));
    // Hangi alanın yanlış olduğu bilerek söylenmez.
    return { error: "Kullanıcı adı veya şifre hatalı.", username };
  }

  reset(limits[0].key);
  reset(limits[1].key);
  await createSession(process.env.ADMIN_USERNAME!);
  await audit("giris-basarili", `Giriş yapıldı: ${username.slice(0, 40)}`);
  redirect("/yonetim");
}

export async function logoutAction() {
  const session = await getAdminSession();
  await destroyCurrentSession();
  if (session) await audit("cikis", `Çıkış yapıldı: ${session.username}`);
  redirect("/yonetim/giris?durum=cikis");
}

export async function revokeOtherSessionsAction() {
  const session = await requireAdmin();
  const count = await destroyOtherSessions(session.idHash);
  await audit("oturum-kapatildi", `${count} oturum kapatıldı`);
  redirect("/yonetim/guvenlik?durum=oturumlar-kapatildi");
}

/* --------------------------------- Kitaplar --------------------------------- */

const PATTERNS: readonly CoverPattern[] = ["grid", "dots", "circle", "sun", "arc", "diag", "stripes", "wave"];
const INKS = ["#ffffff", "#26213f"] as const;
const CATEGORY_SLUGS = categories.map((c) => c.slug);

export async function saveBookAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const f = new Form(fd);
  const editing = fd.get("mod") === "duzenle";

  const title = f.text("title", "Başlık", 1, 80);
  const author = f.text("author", "Yazar", 2, 80);
  const year = f.int("year", "Yayın yılı", -800, new Date().getFullYear() + 1);
  const category = f.oneOf("category", "kategori", CATEGORY_SLUGS);
  const pages = f.int("pages", "Sayfa sayısı", 1, 10000);
  const readMinutes = f.int("readMinutes", "Okuma süresi", 1, 60);
  const difficulty = f.int("difficulty", "Zorluk", 1, 3) as 1 | 2 | 3;
  const color = f.hexColor("color", "Kapak rengi");
  const ink = f.oneOf("ink", "yazı rengi", INKS);
  const pattern = f.oneOf("pattern", "desen", PATTERNS);
  const tagline = f.text("tagline", "Kısa tanıtım", 5, 160);
  const summaryText = f.text("summary", "Özet", 40, 3000, { multiline: true });

  const summary = summaryText.split(/\n\s*\n/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
  if (!f.errors.summary && summary.length > 6) f.errors.summary = "Özet en fazla 6 paragraf olabilir.";

  const ideas: Book["ideas"] = [];
  for (let i = 1; i <= 4; i++) {
    const t = cleanText(f.raw(`idea${i}Title`)).slice(0, 200);
    const x = cleanText(f.raw(`idea${i}Text`)).slice(0, 600);
    if (!t && !x) continue;
    if (!t || !x) f.errors[`idea${i}`] = "Başlık ve açıklamanın ikisi de dolu olmalı.";
    else if (t.length > 60 || x.length > 240) f.errors[`idea${i}`] = "Başlık en fazla 60, açıklama en fazla 240 karakter.";
    else ideas.push({ title: t, text: x });
  }
  if (ideas.length === 0 && !Object.keys(f.errors).some((k) => k.startsWith("idea"))) {
    f.errors.idea1 = "En az bir ana fikir ekle.";
  }

  let slug: string;
  if (editing) {
    slug = f.raw("originalSlug");
    if (!SLUG_RE.test(slug)) return { error: "Düzenlenen kitap bulunamadı." };
  } else {
    slug = (f.raw("slug").trim() || slugify(title)).toLowerCase();
    if (!SLUG_RE.test(slug) || slug.length > 60) {
      f.errors.slug = "Sadece küçük harf, rakam ve tire kullanılabilir (en fazla 60 karakter).";
    }
  }

  if (!f.ok) {
    return { error: "Formda düzeltilmesi gereken alanlar var.", fieldErrors: f.errors, values: snapshot(fd) };
  }

  const book: Book = {
    slug, title, author, year, category, pages, readMinutes, difficulty,
    color, ink, pattern, tagline, summary, ideas,
  };

  const outcome = await mutate((d) => {
    const index = d.books.findIndex((b) => b.slug === slug);
    if (editing) {
      if (index === -1) return "yok";
      d.books[index] = book;
    } else {
      if (index !== -1) return "var";
      d.books.push(book);
    }
    return "ok";
  });

  if (outcome === "yok") return { error: "Bu kitap artık yok; silinmiş olabilir." };
  if (outcome === "var") {
    return { error: "Bu adres zaten kullanılıyor.", fieldErrors: { slug: "Başka bir adres seç." }, values: snapshot(fd) };
  }

  await audit("icerik", `Kitap ${editing ? "güncellendi" : "eklendi"}: ${title}`);
  revalidatePath("/", "layout");
  redirect(`/yonetim/kitaplar?durum=${editing ? "guncellendi" : "eklendi"}`);
}

export async function deleteBookAction(fd: FormData) {
  await requireAdmin();
  const slug = fd.get("slug");
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) redirect("/yonetim/kitaplar");

  const title = await mutate((d) => {
    const book = d.books.find((b) => b.slug === slug);
    if (!book) return null;
    d.books = d.books.filter((b) => b.slug !== slug);
    d.questions = d.questions.filter((q) => q.bookSlug !== slug);
    d.comments = d.comments.filter((c) => c.bookSlug !== slug);
    return book.title;
  });

  if (title) await audit("icerik", `Kitap silindi (soruları ve yorumlarıyla): ${title}`);
  revalidatePath("/", "layout");
  redirect("/yonetim/kitaplar?durum=silindi");
}

/* --------------------------------- Sorular --------------------------------- */

export async function saveQuestionAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const f = new Form(fd);
  const editing = fd.get("mod") === "duzenle";

  const bookSlug = f.raw("bookSlug");
  if (!SLUG_RE.test(bookSlug)) f.errors.bookSlug = "Bir kitap seç.";
  const text = f.text("text", "Soru", 5, 300);
  const options = [0, 1, 2, 3].map((i) => f.text(`o${i}`, `${"ABCD"[i]} şıkkı`, 1, 120));
  const correct = f.int("correct", "Doğru cevap", 0, 3);
  const explanation = f.text("explanation", "Açıklama", 5, 400);

  const seen = new Set<string>();
  options.forEach((o, i) => {
    const key = o.toLocaleLowerCase("tr");
    if (o && seen.has(key)) f.errors[`o${i}`] = "Şıklar birbirinden farklı olmalı.";
    seen.add(key);
  });

  const id = editing ? f.raw("id") : `${bookSlug.slice(0, 60)}-${newId("s").slice(2)}`;
  if (!ID_RE.test(id)) return { error: "Geçersiz soru." };

  if (!f.ok) {
    return { error: "Formda düzeltilmesi gereken alanlar var.", fieldErrors: f.errors, values: snapshot(fd) };
  }

  const outcome = await mutate((d) => {
    if (!d.books.some((b) => b.slug === bookSlug)) return "kitap-yok";
    const question = { id, bookSlug, text, options, correct, explanation };
    const index = d.questions.findIndex((q) => q.id === id);
    if (editing) {
      if (index === -1) return "yok";
      d.questions[index] = question;
    } else {
      d.questions.push(question);
    }
    return "ok";
  });

  if (outcome === "kitap-yok") return { error: "Seçilen kitap bulunamadı.", fieldErrors: { bookSlug: "Bir kitap seç." }, values: snapshot(fd) };
  if (outcome === "yok") return { error: "Bu soru artık yok; silinmiş olabilir." };

  await audit("icerik", `Soru ${editing ? "güncellendi" : "eklendi"}: ${text.slice(0, 60)}`);
  revalidatePath("/", "layout");
  redirect(`/yonetim/sorular?kitap=${bookSlug}&durum=${editing ? "guncellendi" : "eklendi"}`);
}

export async function deleteQuestionAction(fd: FormData) {
  await requireAdmin();
  const id = fd.get("id");
  if (typeof id !== "string" || !ID_RE.test(id)) redirect("/yonetim/sorular");

  const removed = await mutate((d) => {
    const q = d.questions.find((x) => x.id === id);
    if (!q) return null;
    d.questions = d.questions.filter((x) => x.id !== id);
    return q;
  });

  if (removed) await audit("icerik", `Soru silindi: ${removed.text.slice(0, 60)}`);
  revalidatePath("/", "layout");
  redirect(`/yonetim/sorular?${removed ? `kitap=${removed.bookSlug}&` : ""}durum=silindi`);
}

/* --------------------------------- Yorumlar --------------------------------- */

export async function deleteCommentAction(fd: FormData) {
  await requireAdmin();
  const id = fd.get("id");
  const filter = fd.get("kitap");
  if (typeof id !== "string" || !/^[a-z0-9-]{1,40}$/.test(id)) redirect("/yonetim/yorumlar");

  const removed = await mutate((d) => {
    const c = d.comments.find((x) => x.id === id);
    if (!c) return null;
    d.comments = d.comments.filter((x) => x.id !== id);
    return c;
  });

  if (removed) await audit("icerik", `Yorum silindi (${removed.author}): ${removed.text.slice(0, 50)}`);
  revalidatePath("/", "layout");
  const keep = typeof filter === "string" && SLUG_RE.test(filter) ? `kitap=${filter}&` : "";
  redirect(`/yonetim/yorumlar?${keep}durum=silindi`);
}

/* --------------------------------- Üyeler --------------------------------- */

const USER_ID_RE = /^u-[0-9a-f]{12}$/;

export async function revokeUserSessionsAction(fd: FormData) {
  await requireAdmin();
  const id = fd.get("id");
  if (typeof id !== "string" || !USER_ID_RE.test(id)) redirect("/yonetim/uyeler");

  const name = await mutate((d) => {
    const u = d.users.find((x) => x.id === id);
    if (!u) return null;
    d.userSessions = d.userSessions.filter((s) => s.userId !== id);
    return u.username;
  });
  if (name) await audit("oturum-kapatildi", `Üyenin tüm oturumları kapatıldı: @${name}`);
  redirect("/yonetim/uyeler?durum=oturumlar-kapatildi");
}

export async function deleteUserAction(fd: FormData) {
  await requireAdmin();
  const id = fd.get("id");
  if (typeof id !== "string" || !USER_ID_RE.test(id)) redirect("/yonetim/uyeler");

  const name = await mutate((d) => {
    const u = d.users.find((x) => x.id === id);
    if (!u) return null;
    d.users = d.users.filter((x) => x.id !== id);
    d.userSessions = d.userSessions.filter((s) => s.userId !== id);
    d.quizAttempts = d.quizAttempts.filter((a) => a.userId !== id);
    d.comments = d.comments.filter((c) => c.userId !== id);
    return u.username;
  });
  if (name) await audit("icerik", `Üye silindi (yorumlarıyla birlikte): @${name}`);
  revalidatePath("/", "layout");
  redirect("/yonetim/uyeler?durum=silindi");
}
