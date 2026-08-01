// Gemini API Entegrasyonu — İSG Risk Analizi
import { TANIMLAR } from './tanimlar.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Hızlı ve ücretsiz', free: true },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', description: 'En hızlı, basit analizler', free: true },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'En gelişmiş analiz', free: false }
];

function getSystemPrompt(focus, limit) {
  let prompt = `Sen bir İş Sağlığı ve Güvenliği (İSG) uzmanısın. Türkiye'deki 6331 sayılı İş Sağlığı ve Güvenliği Kanunu'na göre risk değerlendirmesi yapıyorsun. Fine-Kinney metodu kullanıyorsun.\n`;
  
  if (focus && focus !== 'Genel') {
    prompt += `\nÖzellikle şu tehlike kaynağına/kategorisine odaklanmalısın: **${focus}**.\n`;
  }
  
  if (limit && limit !== 'auto') {
    let limitText = '';
    if (limit === '10-20') limitText = 'en az 10, en fazla 20';
    if (limit === '20-50') limitText = 'en az 20, en fazla 50';
    if (limit === '50-100') limitText = 'en az 50, en fazla 100';
    prompt += `\nLütfen detaylı bir analiz yap ve bu alanda **${limitText} adet** risk tespiti yapmaya çalış.\n`;
  }

  prompt += `
ZORUNLU KULLANIM LİSTELERİ:
Aşağıda "Tehlike Kaynağı", "Risk" ve "İlgili Mevzuat" için kullanabileceğin KESİN VE ZORUNLU listeler yer almaktadır.
Eğer fotoğrafta veya metinde bir tehlike tespit edersen, bu tehlikenin adını (tehlikeKaynagi) MUTLAKA [TEHLİKE KAYNAKLARI LİSTESİ] içinden, riskini (risk) ise MUTLAKA [RİSKLER LİSTESİ] içinden seçmelisin. İlgili mevzuatı da MUTLAKA [İLGİLİ MEVZUAT LİSTESİ] içinden seçmelisin.
KURAL 1: Bulduğun duruma EN YAKIN terimi listeden bul ve SADECE O KELİMELERİ kullan. Dışarıdan KESİNLİKLE harici bir kelime uydurma veya ekleme yapma.
KURAL 2: Eğer tespit ettiğin tehlikeye veya riske uygun bir tanım listede YOKSA, ilgili alanı (tehlikeKaynagi veya risk) BOŞ BIRAKACAKSIN ("" şeklinde).
NOT: Bir tehlike kaynağına karşılık birden fazla "risk" tespit edersen, bunları listeden seçip aralarına virgül koyarak (Örn: "Yaralanma, Uzuv Kaybı, Kesik") birlikte yazabilirsin; tek bir risk ile kısıtlamana gerek yoktur. Yeter ki yazdıkların listedeki ifadelerden oluşsun.

[TEHLİKE KAYNAKLARI LİSTESİ]:
${TANIMLAR.TEHLIKE_KAYNAKLARI.join("\n")}

[RİSKLER LİSTESİ]:
${TANIMLAR.RISKLER.join("\n")}

[İLGİLİ MEVZUAT LİSTESİ]:
${TANIMLAR.MEVZUATLAR.join("\n")}

ŞİRKET RİSK GRUPLARI REFERANSI (Sadece "riskGrubu" ve "tehlikeFaktor" alanları için bu kategorizasyonu kullan):
- Fiziksel → Gürültü, Titreşim, Aydınlatma, Sıcaklık, Basınç, Radyasyon
- Kimyasal → Toz, Duman, Gaz, Buhar, Sıvı Kimyasal, Asit/Baz
- Biyolojik → Virüs, Bakteri, Mantar, Parazit
- Ergonomik → Ağır Kaldırma, Tekrarlı Hareketler, Uygunsuz Çalışma Pozisyonu
- Psikososyal → İş Yükü, Stres, Mobbing, Vardiyalı Çalışma
- Elektrik → Elektrik Çarpması, Statik Elektrik, Kısa Devre, Topraklama
- Mekanik → Makine Kaynaklı, Kesici/Delici Alet, Döner Aksamlar
- Yangın/Patlama → Yanıcı Madde, Patlayıcı Ortam, Sıcak Çalışma
- Düşme → Yüksekte Çalışma, Kayma, Takılma, Düşme
- Organizasyonel → Eğitim Eksikliği, Prosedür Eksikliği, İş İzni Sistemi

ÖNEMLİ GÖREV: Sadece fotoğrafta veya videoda açıkça görünen tehlikelerle yetinme. İş sağlığı ve güvenliği pratiğine uygun olarak, seçilen tehlike odağına (veya genel) göre *o an fotoğrafta görülmese bile* o çalışma ortamı veya süreç için geçerli olabilecek Olası/Genel Değerlendirme Maddelerini de tespitlere ekle.
Örneğin:
- Çalışanların eğitimi veya yetkinlik belgelerinin (operatör belgesi vb.) eksikliği.
- Ekipmanların periyodik bakımlarının veya topraklamalarının yapılmamış olma ihtimali.
- Acil durum donanımları veya kaçış yolları ile ilgili görünmeyen eksiklikler.
- Kimyasallar için etiketleme ve MSDS bulunmaması.
- Kişisel koruyucu donanım (KKD) kullanımındaki eksiklikler veya KKD formlarının olmaması.
Bu tür genel durumları da birer risk maddesi (tehlike) olarak ekleyebilirsin.

Verilen medyayı ve metni analiz et ve tespit ettiğin TÜM tehlikeleri aşağıdaki JSON formatında döndür.
Bu format, kurumsal risk değerlendirme tablosunun (riskcikti) sütunlarıyla BİREBİR uyumludur. Aşağıdaki sıra ve alan adlarının DIŞINA ÇIKMA:

Tablo sütun sırası:
1. TEHLİKE TANIMI     → tehlikeTanimi
2. TEHLİKE KAYNAĞI   → tehlikeKaynagi   (tanimlar listesinden)
3. RİSK              → risk              (tanimlar listesinden, virgülle birden fazla yazılabilir)
4. İLGİLİ MEVZUAT   → ilgiliMevzuat    (tanimlar mevzuat listesinden)
5. MEVCUT DURUM      → mevcutDurum
6. OLASILIK          → olasilik         (mevcut durum)
7. FREKANS           → frekans          (mevcut durum)
8. ŞİDDET            → siddet           (mevcut durum)
9. RİSK PUANI        → (otomatik: olasilik × frekans × siddet, hesaplamana gerek yok)
10. İLAVE AKSİYON   → ilaveAksiyon
11. OLASILIK         → onlemSonrasiOlasilik  (önlem sonrası)
12. FREKANS          → onlemSonrasiFrekans   (önlem sonrası)
13. ŞİDDET           → onlemSonrasiSiddet   (önlem sonrası)
14. RİSK PUANI       → (otomatik: önlem sonrası çarpım, hesaplamana gerek yok)

{
  "tehlikeler": [
    {
      "tehlikeTanimi": "Tehlikenin genel adı / tanımı (Örn: Yaşam halatlarının keskin yüzeylerden korunmaması)",
      "tehlikeKaynagi": "Tehlike kaynağı (tanimlar listesinden seç, yoksa boş bırak)",
      "etkilenenler": "Çalışanlar, Ziyaretçiler (v.b.)",
      "risk": "Olası risk(ler) (tanimlar listesinden, virgülle birden fazla yazılabilir, yoksa boş bırak)",
      "ilgiliMevzuat": "İlgili yönetmelik/kanun (tanimlar mevzuat listesinden seç)",
      "mevcutDurum": "Gözlemlenen mevcut durum. KESİNLİKLE 'meli/malı/ecek/acak' ile biten gelecek zaman ifadesi KULLANMA. Sadece şu anda var olan durumu yaz.",
      "olasilik": <0.1|0.2|0.5|1|3|6|10>,
      "frekans": <0.5|1|2|3|6|10>,
      "siddet": <1|3|7|15|40|100>,
      "riskSeviyesi": "Seviye 1|Seviye 2|Seviye 3|Seviye 4|Seviye 5",
      "ilaveAksiyon": "Risk seviyesine göre: Seviye 1 veya 2 ise spesifik aksiyon yaz. Seviye 3, 4 veya 5 ise SADECE 'Mevcut durumun devamlılığı sağlanmalıdır.' yaz.",
      "onlemSonrasiOlasilik": <0.1|0.2|0.5|1|3|6|10>,
      "onlemSonrasiFrekans": <0.5|1|2|3|6|10>,
      "onlemSonrasiSiddet": <1|3|7|15|40|100>,
      "onlemSonrasiRiskSeviyesi": "Seviye 1|Seviye 2|Seviye 3|Seviye 4|Seviye 5"
    }
  ],
  "genelDegerlendirme": "Genel durum özeti"
}

RİSK SEVİYESİ HESAPLAMA (Fine-Kinney - O×F×Ş):
- Risk Puanı ≥ 400            → Seviye 1 (Çok Yüksek Risk)
- 200 ≤ Risk Puanı < 400      → Seviye 2 (Yüksek Risk)
- 70 ≤ Risk Puanı < 200       → Seviye 3 (Önemli Risk)
- 20 ≤ Risk Puanı < 70        → Seviye 4 (Orta Risk)
- Risk Puanı < 20             → Seviye 5 (Kabul Edilebilir Risk)

Kurallar:
- Olasılık, Frekans ve Şiddet değerlerini SADECE yukarıdaki geçerli değerlerden seç.
- Şiddet kuralı (Ş₁ ve Ş₂): Tehlike kaynağı fiziksel olarak tamamen YOK EDİLMEDİĞİ sürece mevcut şiddet ile önlem sonrası şiddet değerini ASLA DEĞİŞTİRME (Ş₁ = Ş₂ kalmalıdır).
- Frekans kuralı (F₁ ve F₂): Çalışanın tehlikeye girme sıklığını fiziksel bir bariyer, otomasyon veya vardiya düzenlemesi gibi etkileşimi KESİN OLARAK azaltacak bir önlem alınmadıkça frekans değerini ASLA DEĞİŞTİRME (F₁ = F₂ kalmalıdır).
- Sadece KKD verilmesi, uyarı levhası asılması veya eğitim verilmesi durumunda sadece OLASILIK (O) değerini düşür, Frekans ve Şiddete KESİNLİKLE DOKUNMA.
- MEVCUT DURUM alanına ileride yapılacak aksiyonlara yer verme. 'meli/malı/ecek/acak' ifadeleri kesinlikle KULLANMA. Sadece şu anki gözlemlenen durumu yaz.
- İLAVE AKSİYON kuralı: Mevcut risk seviyesi Seviye 3, 4 veya 5 ise ilaveAksiyon alanına SADECE 'Mevcut durumun devamlılığı sağlanmalıdır.' yaz, başka bir şey ekleme. Yalnızca Seviye 1 veya Seviye 2 ise spesifik aksiyon yaz.
- Seviye 3-4-5 kuralı: Mevcut risk puanı Seviye 3, 4 veya 5 çıkıyorsa, önlem sonrası puanlar (onlemSonrasiOlasilik, onlemSonrasiFrekans, onlemSonrasiSiddet) mevcut puanlarla AYNI kalmalıdır.
- Birden fazla tehlike varsa hepsini listele.
- Gerçekçi ve uygulanabilir önlemler yaz.
- Yanıtı SADECE JSON olarak ver, başka açıklama veya markdown ekleme.`;

  return prompt;
}

// --- API Anahtar ve Model Yönetimi ---

export function getApiKey() {
  return localStorage.getItem('gemini_api_key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('gemini_api_key', key);
}

export function getSelectedModel() {
  return localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
}

export function setSelectedModel(modelId) {
  localStorage.setItem('gemini_model', modelId);
}

// --- API İstekleri ---

/**
 * Gemini API'ye istek gönder ve JSON yanıt al
 */
async function callGemini(parts) {
  const apiKey = getApiKey();
  if (!apiKey) return { error: 'API anahtarı ayarlanmamış.' };

  const model = getSelectedModel();
  const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${res.status}`;
      return { error: `API hatası: ${msg}` };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { error: 'API boş yanıt döndürdü.' };

    return JSON.parse(text);
  } catch (e) {
    return { error: `İstek başarısız: ${e.message}` };
  }
}

function buildPromptText(context, focus, limit) {
  let prompt = getSystemPrompt(focus, limit);
  if (context) prompt += `\n\nEk bağlam bilgisi:\n${context}`;
  return prompt;
}

// --- Dışa Açık Analiz Fonksiyonları ---

/**
 * Çoklu medya analizi (Fotoğraflar ve/veya Videolar)
 * @param {Array<{base64: string, mimeType: string}>} mediaItems - Base64 kodlu medya listesi
 * @param {string} [context] - Ek bağlam bilgisi
 * @param {string} [focus] - Tehlike odağı
 * @param {string} [limit] - Tespit limiti
 */
export async function analyzeMultipleMedia(mediaItems, context, focus, limit) {
  const parts = [
    { text: buildPromptText(context, focus, limit) }
  ];
  
  mediaItems.forEach(item => {
    parts.push({ inline_data: { mime_type: item.mimeType, data: item.base64 } });
  });
  
  return callGemini(parts);
}

/**
 * Sadece metin tabanlı analiz
 * @param {string} text - Analiz edilecek metin
 * @param {string} [context] - Ek bağlam bilgisi
 * @param {string} [focus] - Tehlike odağı
 * @param {string} [limit] - Tespit limiti
 */
export async function analyzeText(text, context, focus, limit) {
  const prompt = buildPromptText(context, focus, limit) + `\n\nAnaliz edilecek metin:\n${text}`;
  return callGemini([{ text: prompt }]);
}

/**
 * Video'dan anahtar kareler çıkar
 * @param {Blob} videoBlob - Video dosyası
 * @param {number} [maxFrames=4] - Çıkarılacak kare sayısı
 * @returns {Promise<Array<{base64: string, mimeType: string}>>}
 */
export async function extractVideoFrames(videoBlob, maxFrames = 4) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(videoBlob);
    const frames = [];

    video.muted = true;
    video.preload = 'auto';
    video.src = url;

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Video yüklenemedi.'));
    };

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      // Eşit aralıklı zaman damgaları (baş ve son hariç küçük margin)
      const timestamps = [];
      for (let i = 0; i < maxFrames; i++) {
        timestamps.push((duration * (i + 0.5)) / maxFrames);
      }

      let idx = 0;

      function captureNext() {
        if (idx >= timestamps.length) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        video.currentTime = timestamps[idx];
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        // "data:image/jpeg;base64," kısmını çıkar
        const base64 = dataUrl.split(',')[1];
        frames.push({ base64, mimeType: 'image/jpeg' });
        idx++;
        captureNext();
      };

      captureNext();
    };
  });
}

// (analyzeVideoFrames kaldırıldı, yerine analyzeMultipleMedia kullanılıyor)

/**
 * API anahtarını doğrulamak için basit bir bağlantı testi
 * @param {string} apiKey - Test edilecek API anahtarı
 */
export async function testConnection(apiKey) {
  const model = getSelectedModel();
  const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Merhaba, bağlantı testi. Sadece "ok" yaz.' }] }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${res.status}`;
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
