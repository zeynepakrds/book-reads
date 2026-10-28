// Hem middleware (edge) hem sunucu tarafında kullanılan sabitler.

const prod = process.env.NODE_ENV === "production";

/**
 * `__Host-` öneki tarayıcıya şunu zorunlu kılar: çerez sadece HTTPS'te,
 * sadece bu alan adında ve `/` yolunda geçerli. Yerel geliştirmede (http)
 * bu önek kullanılamadığı için düz ad kullanılır.
 */
export const ADMIN_COOKIE = prod ? "__Host-ayrac-yonetim" : "ayrac-yonetim";

/** Oturumun en uzun ömrü: 8 saat. */
export const SESSION_MAX_AGE_S = 8 * 60 * 60;

/** Bu kadar süre işlem yapılmazsa oturum kapanır: 45 dakika. */
export const SESSION_IDLE_MS = 45 * 60 * 1000;

export const ADMIN_LOGIN_PATH = "/yonetim/giris";
