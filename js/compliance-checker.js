// compliance-checker.js — 6331 Sayılı İSG Kanunu uyum kontrolü
// Kural tabanlı mevzuat uygunluk denetleyici

/**
 * Uyum kontrol kalemleri — her birinin tetikleyici anahtar kelimeleri var.
 * Boş triggers dizisi = her zaman tetiklenir.
 */
export const COMPLIANCE_ITEMS = [
    { id: 'msds', label: 'MSDS / Güvenlik Bilgi Formu', icon: '🧪', triggers: ['kimyasal', 'madde', 'solvent', 'asit', 'baz', 'boya', 'tiner'] },
    { id: 'kullanma_talimati', label: 'Makine Kullanma Talimatı', icon: '⚙️', triggers: ['makine', 'ekipman', 'tezgah', 'pres', 'kompresör', 'vinç', 'forklift', 'asansör'] },
    { id: 'acil_durum', label: 'Acil Durum Planı', icon: '🚨', triggers: [] },
    { id: 'yangin', label: 'Yangın Güvenlik Planı', icon: '🔥', triggers: [] },
    { id: 'kkd', label: 'Kişisel Koruyucu Donanım (KKD) Listesi', icon: '🦺', triggers: ['çalışan', 'personel', 'işçi', 'operatör'] },
    { id: 'saglik', label: 'Sağlık Gözetim Kayıtları', icon: '🏥', triggers: ['çalışan', 'personel', 'işçi'] },
    { id: 'egitim', label: 'Eğitim Kayıtları', icon: '📚', triggers: [] },
    { id: 'calisma_izni', label: 'Çalışma İzinleri', icon: '📋', triggers: ['yüksekte', 'sıcak çalışma', 'kapalı alan', 'kazı', 'elektrik'] },
    { id: 'bakim', label: 'Periyodik Bakım Kayıtları', icon: '🔧', triggers: ['makine', 'ekipman', 'tezgah', 'kompresör', 'asansör', 'vinç'] },
    { id: 'kaza_kaydi', label: 'İş Kazası / Ramak Kala Kayıtları', icon: '📊', triggers: [] }
];

/**
 * Durum seçenekleri — her uyum kalemi için atanabilir
 */
export const STATUS_OPTIONS = [
    { value: 'mevcut', label: '✅ Mevcut', color: '#22c55e' },
    { value: 'eksik', label: '❌ Eksik', color: '#ef4444' },
    { value: 'sonra', label: '⏳ Sonra eklenecek', color: '#eab308' }
];

/**
 * AI tespit flag'lerini uyum ID'lerine eşler
 */
const AI_FLAG_MAP = {
    msdsGerekli: 'msds',
    kullanmaTalimatiGerekli: 'kullanma_talimati',
    kkdGerekli: 'kkd',
    saglikGozetimiGerekli: 'saglik',
    calismaIzniGerekli: 'calisma_izni',
    bakimGerekli: 'bakim'
};

/**
 * Risk metni ve AI tespitlerine göre hangi uyum kalemlerinin tetiklendiğini belirler
 * @param {string} riskText - Risk açıklama metni
 * @param {Object} [aiDetections] - Gemini AI'dan gelen tespit flag'leri
 * @returns {Array<{id, label, icon, status}>} Tetiklenen uyum kalemleri
 */
export function checkCompliance(riskText = '', aiDetections = null) {
    const textLower = (riskText || '').toLocaleLowerCase('tr');

    // AI tarafından tetiklenen ID'ler
    const aiTriggeredIds = new Set();
    if (aiDetections) {
        for (const [flag, itemId] of Object.entries(AI_FLAG_MAP)) {
            if (aiDetections[flag]) aiTriggeredIds.add(itemId);
        }
    }

    const triggered = [];

    for (const item of COMPLIANCE_ITEMS) {
        let match = false;

        // Boş triggers = her zaman tetiklenir
        if (item.triggers.length === 0) {
            match = true;
        }

        // Metin içinde trigger kelime aranır
        if (!match) {
            match = item.triggers.some(trigger =>
                textLower.includes(trigger.toLocaleLowerCase('tr'))
            );
        }

        // AI flag kontrolü
        if (!match) {
            match = aiTriggeredIds.has(item.id);
        }

        if (match) {
            triggered.push({
                id: item.id,
                label: item.label,
                icon: item.icon,
                status: 'pending'
            });
        }
    }

    return triggered;
}

/**
 * Değerlendirmeye ait uyum durumu özeti
 * @param {Array<{status: string}>} assessmentCompliance - Uyum kalemleri listesi
 * @returns {{total: number, mevcut: number, eksik: number, sonraEklenecek: number}}
 */
export function getComplianceStatus(assessmentCompliance = []) {
    const result = { total: assessmentCompliance.length, mevcut: 0, eksik: 0, sonraEklenecek: 0 };

    for (const item of assessmentCompliance) {
        if (item.status === 'mevcut') result.mevcut++;
        else if (item.status === 'eksik') result.eksik++;
        else if (item.status === 'sonra') result.sonraEklenecek++;
        // 'pending' durumu hiçbir sayaca eklenmez
    }

    return result;
}
