/**
 * Girişten sonra gidilecek adres (?sonra=...). Sadece bu sitenin içindeki
 * yollara izin verilir; "//kotu-site.com" veya "https://..." gibi değerler
 * başka siteye yönlendirme (open redirect) için kullanılamaz.
 */
export function safeNext(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 200) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  if (/^\/(giris|uye-ol|yonetim)(\/|\?|$)/.test(value)) return fallback;
  return value;
}
