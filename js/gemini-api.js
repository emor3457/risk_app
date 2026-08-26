// AI API Entegrasyonu — İSG Risk Analizi (Gemini, Groq, OpenRouter)
import { TANIMLAR } from './tanimlar.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_BASE   = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEEPSEEK_BASE = 'https://api.deepseek.com/chat/completions';
const KIMI_BASE = 'https://api.moonshot.cn/v1/chat/completions';

// SİSTEM TANIMI: Kullanıcının seçebileceği provider + model kombinasyonları
export const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    logo: '🔵',
    apiKeyLink: 'https://aistudio.google.com/app/apikey',
    apiKeyHint: 'Google AI Studio\'dan ücretsiz anahtar alın (AIzaSy... ile başlar)',
    apiKeyPlaceholder: 'AIzaSy...',
    models: [
      { id: 'gemini-1.5-flash',      name: 'Gemini 1.5 Flash',      description: 'Hızlı ve dengeli (Önerilen)',  free: true  },
      { id: 'gemini-1.5-pro',        name: 'Gemini 1.5 Pro',        description: 'Karmaşık analizler için',       free: true  },
      { id: 'gemini-2.0-flash',      name: 'Gemini 2.0 Flash',      description: 'Yeni nesil hızlı',             free: true  },
      { id: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash',      description: 'En son nesil (Yüksek talep)',   free: true  },
      { id: 'gemini-3.0-flash',      name: 'Gemini 3.0 Flash',      description: 'En güncel 3.0 serisi',          free: true  },
      { id: 'gemini-3.0-pro',        name: 'Gemini 3.0 Pro',        description: 'En güncel gelişmiş sürüm',      free: false }
    ]
  },
  {
    id: 'groq',
    name: 'Groq (Llama / Mixtral)',
    logo: '⚡',
    apiKeyLink: 'https://console.groq.com/keys',
    apiKeyHint: 'Groq Console\'dan ücretsiz anahtar alın (gsk_... ile başlar). Llama3 ve Mixtral modelleri ücretsiz.',
    apiKeyPlaceholder: 'gsk_...',
    models: [
      { id: 'llama-3.3-70b-versatile',  name: 'Llama 3.3 70B',       description: 'Güçlü ve ücretsiz',    free: true  },
      { id: 'llama-3.1-8b-instant',     name: 'Llama 3.1 8B',        description: 'En hızlı ücretsiz',   free: true  },
      { id: 'mixtral-8x7b-32768',       name: 'Mixtral 8x7B',        description: 'Ücretsiz, çok dilli', free: true  }
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (100+ Model)',
    logo: '🔀',
    apiKeyLink: 'https://openrouter.ai/keys',
    apiKeyHint: 'OpenRouter\'dan anahtar alın. Ücretsiz kredinizle Llama, Mistral, Claude vb. 100+ modele erişin.',
    apiKeyPlaceholder: 'sk-or-...',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B',    description: 'Ücretsiz - Güçlü',     free: true  },
      { id: 'mistralai/mistral-7b-instruct:free',      name: 'Mistral 7B',      description: 'Ücretsiz - Hızlı',     free: true  },
      { id: 'google/gemini-2.5-flash',                 name: 'Gemini 2.5 Flash', description: 'OpenRouter üzeri', free: false }
    ]
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    logo: '🟢',
    apiKeyLink: 'https://build.nvidia.com/models',
    apiKeyHint: 'Nvidia Developer sayfasından 1000 ücretsiz kredi alabilirsiniz (nvapi- ile başlar).',
    apiKeyPlaceholder: 'nvapi-...',
    models: [
      { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', description: 'Nvidia üzerinden devasa Llama', free: true },
      { id: 'meta/llama-3.3-70b-instruct',  name: 'Llama 3.3 70B',  description: 'Hızlı ve yetenekli', free: true },
      { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 340B', description: 'Nvidia özel modeli', free: true }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: '🐋',
    apiKeyLink: 'https://platform.deepseek.com/',
    apiKeyHint: 'DeepSeek platformundan anahtar alın (sk- ile başlar). Ucuz ve çok başarılı kod/mantık modeli.',
    apiKeyPlaceholder: 'sk-...',
    models: [
      { id: 'deepseek-chat',   name: 'DeepSeek V3 (Chat)',   description: 'Genel kullanım için', free: false },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Akıl Yürütme)', description: 'Karmaşık mantık işlemleri için (CoT)', free: false }
    ]
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot AI)',
    logo: '🌙',
    apiKeyLink: 'https://platform.moonshot.cn/console/api-keys',
    apiKeyHint: 'Moonshot AI platformundan anahtar alın. (sk- ile başlar). Geniş bağlam (context) desteği.',
    apiKeyPlaceholder: 'sk-...',
    models: [
      { id: 'moonshot-v1-8k',  name: 'Kimi (8K)',  description: 'Hızlı ve temel analiz', free: false },
      { id: 'moonshot-v1-32k', name: 'Kimi (32K)', description: 'Uzun rapor analizleri', free: false }
    ]
  }
];

// Geriye dönük uyumluluk için — app.js hâlâ MODELS'i kullanıyor olabilir
export const MODELS = PROVIDERS[0].models;


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

ÖZEL TALİMAT (EKSİK FORM DOLDURMA):
Eğer kullanıcı size mevcut bir risk değerlendirmesi taslağını (PDF veya tablo metni) kopyalayıp gönderdiyse ve bazı sütunlar (Tehlike Kaynağı, Risk, İlgili Mevzuat, Puanlar vb.) eksik veya boşsa; satır satır tüm tehlikeleri analiz et ve bu kurallara göre EKSİK KALAN TÜM HÜCRELERİ doldurarak eksiksiz bir liste döndür.

Verilen medyayı ve metni analiz et ve tespit ettiğin TÜM tehlikeleri aşağıdaki JSON formatında döndür.
Bu format, kurumsal risk değerlendirme tablosunun (riskcikti) sütunlarıyla BİREBİR uyumludur. Aşağıdaki sıra ve alan adlarının DIŞINA ÇIKMA:

Tablo sütun sırası:
1. TEHLİKE TANIMI     → tehlikeTanimi
2. TEHLİKE KAYNAĞI   → tehlikeKaynagi   (tanimlar listesinden)
3. ETKİLENENLER      → etkilenenler     (Örn: Çalışanlar, Ziyaretçiler)
4. RİSK              → risk              (tanimlar listesinden, virgülle birden fazla yazılabilir)
5. İLGİLİ MEVZUAT   → ilgiliMevzuat    (tanimlar mevzuat listesinden)
6. MEVCUT DURUM      → mevcutDurum
7. OLASILIK          → olasilik         (mevcut durum)
8. FREKANS           → frekans          (mevcut durum)
9. ŞİDDET            → siddet           (mevcut durum)
10. RİSK PUANI        → (otomatik: olasilik × frekans × siddet, hesaplamana gerek yok)
11. İLAVE AKSİYON   → ilaveAksiyon
12. OLASILIK         → onlemSonrasiOlasilik  (önlem sonrası)
13. FREKANS          → onlemSonrasiFrekans   (önlem sonrası)
14. ŞİDDET           → onlemSonrasiSiddet   (önlem sonrası)
15. RİSK PUANI       → (otomatik: önlem sonrası çarpım, hesaplamana gerek yok)

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

RİSK SEVİYESİ TANIMLARI (ornek5li tablosundan - Fine-Kinney O×F×Ş):
- Risk Puanı ≥ 400            → Seviye 1 | ÇOK YÜKSEK RİSK      | Derhal aksiyon zorunlu
- 200 ≤ Risk Puanı < 400      → Seviye 2 | YÜKSEK RİSK          | Kısa sürede aksiyon gerekli
- 70 ≤ Risk Puanı < 200       → Seviye 3 | ÖNEMLİ RİSK          | Planlı iyileştirme yapılabilir
- 20 ≤ Risk Puanı < 70        → Seviye 4 | ORTA RİSK            | Gözetim altında tutulmalı
- Risk Puanı < 20             → Seviye 5 | KABULEDİLEBİLİR RİSK | Kayıt altında tutulur

Kurallar:
- Olasılık, Frekans ve Şiddet değerlerini SADECE yukarıdaki geçerli değerlerden seç.
- Şiddet kuralı (Ş₁ ve Ş₂): Tehlike kaynağı fiziksel olarak tamamen YOK EDİLMEDİĞİ sürece mevcut şiddet ile önlem sonrası şiddet değerini ASLA DEĞİŞTİRME (Ş₁ = Ş₂ kalmalıdır).
- Frekans kuralı (F₁ ve F₂): Çalışanın tehlikeye girme sıklığını fiziksel bir bariyer, otomasyon veya vardiya düzenlemesi gibi etkileşimi KESİN OLARAK azaltacak bir önlem alınmadıkça frekans değerini ASLA DEĞİŞTİRME (F₁ = F₂ kalmalıdır).
- Sadece KKD verilmesi, uyarı levhası asılması veya eğitim verilmesi durumunda sadece OLASILIK (O) değerini düşür, Frekans ve Şiddete KESİNLİKLE DOKUNMA.
- MEVCUT DURUM alanına ileride yapılacak aksiyonlara yer verme. 'meli/malı/ecek/acak' ifadeleri kesinlikle KULLANMA. Sadece şu anki gözlemlenen durumu yaz.
- İLAVE AKSİYON MANTIĞI (İKİ ADIMLI KARAR - KESİNLİKLE UYGULA):
  ADIM 1: Mevcut durumu değerlendir.
    → Mevcut durumda 'yok', 'bulunmamakta', 'yapılmamakta', 'yetersiz', 'eksik', 'uygunsuz', 'kullanılmıyor', 'arızalı', 'kapalı', 'sağlanamamakta', 'varsayılmaktadır' gibi EKSİKLİK/SORUN ifadeleri varsa → Bu durum EKSİKLİK durumudur.
    → Mevcut durumda 'yapılmaktadır', 'uygulanmaktadır', 'mevcuttur', 'dağıtılmaktadır', 'sertifikalandırılmaktadır', 'düzenli olarak gerçekleştirilmektedir', 'takip edilmektedir' gibi OLUMLU ifadeler varsa → Bu durum YETERLİ durumudur.
  ADIM 2: Aksiyonu belirle.
    → EKSİKLİK durumu ise: Risk seviyesi Seviye 3, 4 veya 5 bile olsa MUTLAKA spesifik düzeltici aksiyon yaz. Önlem sonrası puanlar bu aksiyon uygulandıktan sonraki beklenen değerleri gösterir.
    → YETERLİ durum VE Seviye 3-4-5 ise: ilaveAksiyon alanına SADECE 'Mevcut durumun devamlılığı sağlanmalıdır.' yaz. Önlem sonrası puanlar mevcut puanlarla AYNI kalır.
    → YETERLİ durum VE Seviye 1-2 ise: Ek iyileştirici spesifik aksiyon yaz.
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
  return localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
}

export function setSelectedModel(modelId) {
  localStorage.setItem('gemini_model', modelId);
}

export function getSelectedProvider() {
  return localStorage.getItem('ai_provider') || 'gemini';
}

export function setSelectedProvider(providerId) {
  localStorage.setItem('ai_provider', providerId);
  // Provider değişince o providerın ilk modelini seç
  const provider = PROVIDERS.find(p => p.id === providerId);
  if (provider && provider.models.length > 0) {
    setSelectedModel(provider.models[0].id);
  }
}

// Provider'a göre API key ânı getir (her provider ayrı key saklar)
export function getProviderApiKey(providerId) {
  return localStorage.getItem(`api_key_${providerId}`) || '';
}

export function setProviderApiKey(providerId, key) {
  localStorage.setItem(`api_key_${providerId}`, key);
  // Gemini için geriye dönük uyumluluk
  if (providerId === 'gemini') localStorage.setItem('gemini_api_key', key);
}

// --- API İstekleri ---

/**
 * Gemini API'ye istek gönder ve JSON yanıt al
 */
async function callGemini(parts) {
  const provider = getSelectedProvider();
  const model    = getSelectedModel();
  const apiKey   = getProviderApiKey(provider) || getApiKey();

  if (!apiKey) return { error: 'API anahtarı ayarlanmamış. Lütfen Ayarlar sayfasından API anahtarınızı girin.' };

  // --- GEMINI ---
  if (provider === 'gemini') {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
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
        return { error: `Gemini hatası: ${err?.error?.message || 'HTTP ' + res.status}` };
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return { error: 'API boş yanıt döndürdü.' };
      return JSON.parse(text);
    } catch (e) {
      return { error: `İstek başarısız: ${e.message}` };
    }
  }

  // --- GROQ / OPENROUTER / NVIDIA / DEEPSEEK / KIMI (OpenAI uyumlu format) ---
  const isGroq = provider === 'groq';
  let url = OPENROUTER_BASE;
  if (provider === 'groq') url = GROQ_BASE;
  else if (provider === 'nvidia') url = NVIDIA_BASE;
  else if (provider === 'deepseek') url = DEEPSEEK_BASE;
  else if (provider === 'kimi') url = KIMI_BASE;

  // Görsel içeren parts'ları metin'e dönüştür (bu modeller görsel desteklemeyebilir)
  const textParts = parts.filter(p => p.text).map(p => p.text).join('\n');
  const hasImages = parts.some(p => p.inline_data);
  const userContent = hasImages
    ? textParts + '\n\n[NOT: Görsel analiz desteklenmiyor, lütfen metinden analiz yap]'
    : textParts;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    if (!isGroq) headers['HTTP-Referer'] = 'https://risk-app.local';

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: userContent }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${res.status}`;
      return { error: `${isGroq ? 'Groq' : 'OpenRouter'} hatası: ${msg}` };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
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
  const provider = getSelectedProvider();
  const model = getSelectedModel();

  if (provider === 'gemini') {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
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
        return { success: false, error: err?.error?.message || `HTTP ${res.status}` };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  } else {
    // OpenAI uyumlu API'ler için test
    let url = OPENROUTER_BASE;
    if (provider === 'groq') url = GROQ_BASE;
    else if (provider === 'nvidia') url = NVIDIA_BASE;
    else if (provider === 'deepseek') url = DEEPSEEK_BASE;
    else if (provider === 'kimi') url = KIMI_BASE;

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      if (provider === 'openrouter') headers['HTTP-Referer'] = 'https://risk-app.local';

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Merhaba, bağlantı testi. Sadece "ok" yaz.' }],
          max_tokens: 10
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err?.error?.message || `HTTP ${res.status}` };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
