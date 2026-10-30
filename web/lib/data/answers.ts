import "server-only";

/**
 * SADECE SUNUCUDA (İLK KURULUM VERİSİ). `server-only` sayesinde bu dosya bir
 * istemci bileşeninden import edilirse derleme hata verir.
 */
export const seedAnswers: Record<string, { correct: number; explanation: string }> = {
  // 1984
  "1984-1": { correct: 1, explanation: "Winston Smith, Hakikat Bakanlığı'nda çalışan ve Parti'ye karşı gizlice düşünmeye başlayan kahramandır." },
  "1984-2": { correct: 2, explanation: "Yenikonuş'ta kelimeler azaldıkça, aykırı düşünceyi ifade etmek de zorlaşır." },
  "1984-3": { correct: 3, explanation: "Hakikat Bakanlığı'nda geçmişe ait kayıtlar, Parti'nin işine gelecek biçimde yeniden yazılır." },
  "1984-4": { correct: 2, explanation: "Julia, Winston'ın Parti'ye karşı yasak ilişki yaşadığı kadındır." },

  // Simyacı
  "simyaci-1": { correct: 0, explanation: "Santiago, İspanya'nın Endülüs bölgesinde koyunlarını otlatan genç bir çobandır." },
  "simyaci-2": { correct: 1, explanation: "Düşündeki hazine, onu Mısır'daki piramitlere doğru yola çıkarır." },
  "simyaci-3": { correct: 2, explanation: "Çöl vahasında tanıştığı Fatima, Santiago'nun âşık olduğu kadındır." },
  "simyaci-4": { correct: 3, explanation: "Hazine, Santiago'nun yolculuğa başladığı yere çok yakın, terk edilmiş kilisenin yanında çıkar." },

  // Suç ve Ceza
  "suc-ve-ceza-1": { correct: 2, explanation: "Rodion Raskolnikov, romanın başkahramanı olan yoksul eski hukuk öğrencisidir." },
  "suc-ve-ceza-2": { correct: 1, explanation: "Raskolnikov yaşlı bir tefeci kadını öldürür ve ardından vicdan azabıyla boğuşur." },
  "suc-ve-ceza-3": { correct: 3, explanation: "Sonya, Raskolnikov'un itiraf etmesinde en önemli rolü oynayan genç kadındır." },
  "suc-ve-ceza-4": { correct: 0, explanation: "Roman, Raskolnikov'un Sibirya'daki sürgün yıllarıyla sona erer." },

  // Küçük Prens
  "kucuk-prens-1": { correct: 2, explanation: "Küçük Prens, evinden çok küçük olan B-612 asteroidinden gelir." },
  "kucuk-prens-2": { correct: 1, explanation: "Anlatıcı, uçağı çölde arıza yapan bir pilottur." },
  "kucuk-prens-3": { correct: 3, explanation: "Tilki, evcilleştirmenin “bağ kurmak” demek olduğunu anlatır." },
  "kucuk-prens-4": { correct: 2, explanation: "Pilot, Sahra Çölü'nde mecburi iniş yapar ve Küçük Prens'le orada karşılaşır." },

  // Sefiller
  "sefiller-1": { correct: 2, explanation: "Valjean, aç yeğenleri için bir somun ekmek çalar." },
  "sefiller-2": { correct: 0, explanation: "Müfettiş Javert, kanunu her şeyin üstünde tutar ve Valjean'ı hiç bırakmaz." },
  "sefiller-3": { correct: 1, explanation: "Valjean, Fantine'in kızı Cosette'i yanına alıp büyütür." },
  "sefiller-4": { correct: 3, explanation: "Piskopos Myriel'in beklenmedik merhameti, Valjean'ın yeni bir hayata başlamasını sağlar." },

  // Hayvan Çiftliği
  "hayvan-ciftligi-1": { correct: 2, explanation: "Yaşlı Majör, ölmeden önce hayvanlara eşit ve özgür bir yaşam rüyasını anlatarak isyan fikrini ateşler." },
  "hayvan-ciftligi-2": { correct: 1, explanation: "Napolyon, rakibi Snowball'u çiftlikten kovdurup yönetimi tek başına ele geçirir." },
  "hayvan-ciftligi-3": { correct: 1, explanation: "Boxer, çiftliğin en çalışkan ve en sadık hayvanıdır; emeğinin sömürülmesinin simgesidir." },
  "hayvan-ciftligi-4": { correct: 2, explanation: "Çiftliğin sahibi Bay Jones, hayvanlar isyan edince kovulur." },

  // Dönüşüm
  "donusum-1": { correct: 1, explanation: "Gregor, dev bir böcek olarak uyanır ve kitap bu dönüşümü açıklamaz." },
  "donusum-2": { correct: 2, explanation: "Gregor, ailesinin borçlarını ödemek için çalışan gezgin bir satış temsilcisidir." },
  "donusum-3": { correct: 3, explanation: "Grete, başlangıçta Gregor'un yemeğini getirir ve odasına bakar." },
  "donusum-4": { correct: 2, explanation: "Babası Gregor'a elma fırlatır; elmalardan biri sırtına saplanıp kalır." },

  // Kürk Mantolu Madonna
  "kurk-mantolu-madonna-1": { correct: 1, explanation: "Roman, Sabahattin Ali'nin 1943 tarihli eseridir." },
  "kurk-mantolu-madonna-2": { correct: 2, explanation: "Raif Efendi, Maria Puder ile Berlin'de tanışır." },
  "kurk-mantolu-madonna-3": { correct: 3, explanation: "Maria, kendi otoportresini de yapan bir ressamdır." },
  "kurk-mantolu-madonna-4": { correct: 1, explanation: "Raif, bir sergide gördüğü kürk mantolu kadın otoportresi sayesinde Maria'yla tanışır." },
};
