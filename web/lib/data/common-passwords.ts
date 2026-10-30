/**
 * Çok yaygın şifreler (küçük harf). Bunlar ve bunların sonuna rakam/sembol
 * eklenmiş halleri kabul edilmez. Saldırganların ilk denediği listeler bunlardır.
 */
export const COMMON_PASSWORDS = new Set([
  "123456", "1234567", "12345678", "123456789", "1234567890", "12345678910", "0123456789",
  "111111", "000000", "123123", "654321", "666666", "121212", "112233", "123321", "987654321",
  "qwerty", "qwerty123", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbn", "zxcvbnm", "1q2w3e4r",
  "1q2w3e4r5t", "1qaz2wsx", "qazwsx", "q1w2e3r4", "asdasd", "asdasdasd", "qweqwe", "qwe123",
  "password", "password1", "passw0rd", "p@ssw0rd", "parola", "parola123", "sifre", "şifre",
  "sifre123", "şifre123", "sifresifre", "admin", "admin123", "administrator", "root", "toor",
  "letmein", "welcome", "iloveyou", "monkey", "dragon", "master", "sunshine", "princess",
  "football", "baseball", "superman", "batman", "starwars", "shadow", "michael", "trustno1",
  "galatasaray", "fenerbahce", "fenerbahçe", "besiktas", "beşiktaş", "trabzonspor", "bursaspor",
  "cimbom", "cimbombom", "ultraslan", "fener", "kartal", "gs1905", "fb1907", "bjk1903", "ts1967",
  "turkiye", "türkiye", "istanbul", "ankara", "izmir", "bursa", "antalya", "atatürk", "ataturk",
  "seniseviyorum", "askim", "aşkım", "canim", "canım", "bebegim", "bebeğim", "sevgilim", "hayatim",
  "anneciğim", "annem", "babam", "kardesim", "ailem", "allah", "bismillah", "mustafa", "mehmet",
  "ahmet", "ali", "ayse", "ayşe", "fatma", "zeynep", "elif", "emre", "burak", "murat", "berat",
  "ayrac", "ayraç", "kitap", "kitaplar", "kitapkurdu", "okuma", "okumak", "kutuphane", "kütüphane",
  "abc123", "abcdef", "abcd1234", "a1b2c3", "aaaaaa", "aaaaaaaa", "zzzzzz", "test", "test123",
  "deneme", "deneme123", "merhaba", "merhaba123", "selam", "selam123", "naber", "kanka", "hello",
  "hello123", "login", "giris", "giriş", "uyelik", "üyelik", "guest", "misafir", "user", "kullanici",
]);
