import type { PublicQuestion } from "@/lib/types";

/**
 * İLK KURULUM VERİSİ: soru metinleri ve şıklar. Doğru cevaplar ayrı dosyada
 * (answers.ts) durur; ikisi ilk açılışta sunucudaki veri dosyasında birleşir.
 * Tarayıcıya giden sorular her zaman doğru cevap OLMADAN gönderilir.
 */
export const seedQuestions: PublicQuestion[] = [
  // 1984
  { id: "1984-1", bookSlug: "1984", text: "Romanın ana karakterinin adı nedir?", options: ["O'Brien", "Winston Smith", "Big Brother", "Parsons"] },
  { id: "1984-2", bookSlug: "1984", text: "Parti'nin düşünceyi daraltmak için kelime dağarcığını azalttığı yapay dil hangisidir?", options: ["Eskikonuş", "Esperanto", "Yenikonuş", "Volapük"] },
  { id: "1984-3", bookSlug: "1984", text: "Winston Smith hangi bakanlıkta çalışır?", options: ["Sevgi Bakanlığı", "Barış Bakanlığı", "Bolluk Bakanlığı", "Hakikat Bakanlığı"] },
  { id: "1984-4", bookSlug: "1984", text: "Winston'ın gizli bir ilişki yaşadığı kadın kimdir?", options: ["Katharine", "Bayan Parsons", "Julia", "Winston'ın annesi"] },

  // Simyacı
  { id: "simyaci-1", bookSlug: "simyaci", text: "Santiago'nun mesleği nedir?", options: ["Çoban", "Tüccar", "Denizci", "Simyacı"] },
  { id: "simyaci-2", bookSlug: "simyaci", text: "Santiago'nun düşünde hazine hangi yapıların yakınında görünür?", options: ["Kalelerin", "Piramitlerin", "Tapınakların", "Kulelerin"] },
  { id: "simyaci-3", bookSlug: "simyaci", text: "Santiago'nun vahada âşık olduğu kadın kimdir?", options: ["Layla", "Sara", "Fatima", "Miriam"] },
  { id: "simyaci-4", bookSlug: "simyaci", text: "Hazine sonunda nerede bulunur?", options: ["Piramitlerin tam dibinde", "Bir vahadaki hurma ağacının altında", "Tanca'daki pazar yerinde", "Yola çıktığı yerin yakınındaki terk edilmiş kilisede"] },

  // Suç ve Ceza
  { id: "suc-ve-ceza-1", bookSlug: "suc-ve-ceza", text: "Romanın başkahramanı kimdir?", options: ["Razumihin", "Marmeladov", "Raskolnikov", "Svidrigaylov"] },
  { id: "suc-ve-ceza-2", bookSlug: "suc-ve-ceza", text: "Raskolnikov kimi öldürür?", options: ["Bir polis memurunu", "Yaşlı bir tefeci kadını", "Ev sahibini", "Kız kardeşinin nişanlısını"] },
  { id: "suc-ve-ceza-3", bookSlug: "suc-ve-ceza", text: "Raskolnikov'u itirafa yönlendiren, ona şefkatle yaklaşan genç kadın kimdir?", options: ["Dunya", "Lizaveta", "Pulheriya", "Sonya"] },
  { id: "suc-ve-ceza-4", bookSlug: "suc-ve-ceza", text: "Raskolnikov cezasını çekmek için nereye gönderilir?", options: ["Sibirya", "Kafkasya", "Kırım", "Finlandiya"] },

  // Küçük Prens
  { id: "kucuk-prens-1", bookSlug: "kucuk-prens", text: "Küçük Prens hangi gezegenden gelmiştir?", options: ["A-17", "C-3", "B-612", "X-9"] },
  { id: "kucuk-prens-2", bookSlug: "kucuk-prens", text: "Hikâyeyi anlatan kişinin mesleği nedir?", options: ["Denizci", "Pilot", "Ressam", "Kâşif"] },
  { id: "kucuk-prens-3", bookSlug: "kucuk-prens", text: "Küçük Prens'e “evcilleştirmek” kavramını öğreten hayvan hangisidir?", options: ["Koyun", "Yılan", "Kuş", "Tilki"] },
  { id: "kucuk-prens-4", bookSlug: "kucuk-prens", text: "Anlatıcının uçağı nerede arıza yapar?", options: ["Alpler", "Amazon ormanları", "Sahra Çölü", "Himalayalar"] },

  // Sefiller
  { id: "sefiller-1", bookSlug: "sefiller", text: "Jean Valjean'ın yıllarca hapis yatmasına yol açan ilk suçunda çaldığı şey nedir?", options: ["Gümüş takımlar", "Bir at", "Ekmek", "Para"] },
  { id: "sefiller-2", bookSlug: "sefiller", text: "Valjean'ı yıllarca izleyen müfettiş kimdir?", options: ["Javert", "Thénardier", "Marius", "Enjolras"] },
  { id: "sefiller-3", bookSlug: "sefiller", text: "Valjean'ın yanına alıp büyüttüğü kız kimdir?", options: ["Éponine", "Cosette", "Fantine", "Azelma"] },
  { id: "sefiller-4", bookSlug: "sefiller", text: "Valjean'ın hayatını değiştiren merhameti gösteren kişi kimdir?", options: ["Marius", "Javert", "Thénardier", "Piskopos Myriel"] },

  // Hayvan Çiftliği
  { id: "hayvan-ciftligi-1", bookSlug: "hayvan-ciftligi", text: "Çiftlikteki isyan fikrini ilk ortaya atan hayvan hangisidir?", options: ["Napolyon", "Boxer", "Yaşlı Majör", "Snowball"] },
  { id: "hayvan-ciftligi-2", bookSlug: "hayvan-ciftligi", text: "Çiftliğin yönetimini sonunda ele geçiren domuz kimdir?", options: ["Snowball", "Napolyon", "Yaşlı Majör", "Benjamin"] },
  { id: "hayvan-ciftligi-3", bookSlug: "hayvan-ciftligi", text: "“Daha çok çalışacağım” diyerek her zorluğa karşılık veren at hangisidir?", options: ["Mollie", "Boxer", "Clover", "Benjamin"] },
  { id: "hayvan-ciftligi-4", bookSlug: "hayvan-ciftligi", text: "İsyanın başında çiftlikten kovulan insanın adı nedir?", options: ["Bay Frederick", "Bay Pilkington", "Bay Jones", "Bay Whymper"] },

  // Dönüşüm
  { id: "donusum-1", bookSlug: "donusum", text: "Gregor Samsa bir sabah uyandığında neye dönüşmüştür?", options: ["Bir fareye", "Dev bir böceğe", "Bir kuşa", "Bir kurda"] },
  { id: "donusum-2", bookSlug: "donusum", text: "Gregor'un mesleği nedir?", options: ["Bankacı", "Öğretmen", "Gezgin satış temsilcisi", "Gazeteci"] },
  { id: "donusum-3", bookSlug: "donusum", text: "Dönüşümden sonra Gregor'a ilk başta bakan aile üyesi kimdir?", options: ["Annesi", "Babası", "Hizmetçi", "Kız kardeşi Grete"] },
  { id: "donusum-4", bookSlug: "donusum", text: "Babası, Gregor'u ne atarak yaralar?", options: ["Ekmek", "Taş", "Elma", "Kitap"] },

  // Kürk Mantolu Madonna
  { id: "kurk-mantolu-madonna-1", bookSlug: "kurk-mantolu-madonna", text: "Kürk Mantolu Madonna'nın yazarı kimdir?", options: ["Sait Faik", "Sabahattin Ali", "Yaşar Kemal", "Orhan Pamuk"] },
  { id: "kurk-mantolu-madonna-2", bookSlug: "kurk-mantolu-madonna", text: "Raif Efendi, Maria ile hangi şehirde tanışır?", options: ["Paris", "Viyana", "Berlin", "Ankara"] },
  { id: "kurk-mantolu-madonna-3", bookSlug: "kurk-mantolu-madonna", text: "Maria Puder'in mesleği nedir?", options: ["Hemşire", "Öğretmen", "Oyuncu", "Ressam"] },
  { id: "kurk-mantolu-madonna-4", bookSlug: "kurk-mantolu-madonna", text: "Raif Efendi ile Maria'nın tanışmasına yol açan şey nedir?", options: ["Bir tren yolculuğu", "Bir sergide gördüğü otoportre", "Ortak bir arkadaş", "Bir gazete ilanı"] },
];

