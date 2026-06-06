// Fine-Kinney Risk Hesaplama Motoru
// R = O × F × Ş (Olasılık × Frekans × Şiddet)

// --- Ölçek Tabloları ---

export const OLASILIK_SCALE = [
  { value: 0.1, label: 'Neredeyse imkansız' },
  { value: 0.2, label: 'Pratik olarak imkansız' },
  { value: 0.5, label: 'Çok düşük ihtimal' },
  { value: 1, label: 'Olası değil ama mümkün' },
  { value: 3, label: 'Alışılmadık ama olabilir' },
  { value: 6, label: 'Oldukça mümkün' },
  { value: 10, label: 'Beklenen, kesin' }
];

export const FREKANS_SCALE = [
  { value: 0.5, label: 'Çok seyrek (yılda bir veya daha az)' },
  { value: 1, label: 'Seyrek (yılda birkaç kez)' },
  { value: 2, label: 'Ara sıra (ayda bir)' },
  { value: 3, label: 'Bazen (haftada bir)' },
  { value: 6, label: 'Sık (her gün)' },
  { value: 10, label: 'Sürekli (devamlı maruziyet)' }
];

export const SIDDET_SCALE = [
  { value: 1, label: 'İlk yardım gerektiren yaralanma' },
  { value: 3, label: 'Küçük hasar / yaralanma' },
  { value: 7, label: 'Önemli yaralanma (tıbbi müdahale)' },
  { value: 15, label: 'Ciddi yaralanma (kalıcı sakatlık)' },
  { value: 40, label: 'Bir ölüm' },
  { value: 100, label: 'Birden fazla ölüm / felaket' }
];

export const RISK_LEVELS = [
  { max: 20, level: 'Kabul Edilebilir', color: '#22c55e', action: 'Acil önlem gerekmez, iyileştirme yapılabilir' },
  { max: 70, level: 'Dikkate Değer', color: '#eab308', action: 'Eylem planlanmalı, eğitim ve izleme ile kontrol' },
  { max: 200, level: 'Önemli', color: '#f97316', action: 'Belirli sürede önlem alınmalı' },
  { max: 400, level: 'Yüksek', color: '#ef4444', action: 'Kısa vadede ciddi önlem, gerekirse iş durdurulmalı' },
  { max: Infinity, level: 'Çok Yüksek', color: '#7c2d12', action: 'Çalışma derhal durdurulmalı' }
];

// --- Ölçek türü → dizi eşlemesi ---
const SCALE_MAP = {
  olasilik: OLASILIK_SCALE,
  frekans: FREKANS_SCALE,
  siddet: SIDDET_SCALE
};

/**
 * Risk skoru hesapla: R = O × F × Ş
 */
export function calculateRiskScore(o, f, s) {
  return o * f * s;
}

/**
 * Verilen skora karşılık gelen risk seviyesi nesnesini döndür
 */
export function getRiskLevel(score) {
  return RISK_LEVELS.find(r => score <= r.max);
}

/**
 * Değerin belirtilen ölçek türünde geçerli olup olmadığını kontrol et
 * @param {number} value - Kontrol edilecek değer
 * @param {'olasilik'|'frekans'|'siddet'} scaleType
 */
export function isValidScale(value, scaleType) {
  const scale = SCALE_MAP[scaleType];
  if (!scale) return false;
  return scale.some(item => item.value === value);
}

/**
 * Belirtilen ölçek türünün seçeneklerini döndür
 * @param {'olasilik'|'frekans'|'siddet'} scaleType
 */
export function getScaleOptions(scaleType) {
  return SCALE_MAP[scaleType] || [];
}
