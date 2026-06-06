// IndexedDB Veritabanı Yöneticisi

const DB_NAME = 'RiskDegerlendirmeDB';
const DB_VERSION = 1;

// Nesne depoları ve indeks tanımları
const STORES = {
  workplaces:   { keyPath: 'id', autoIncrement: true, indexes: ['isverenAdi'] },
  departments:  { keyPath: 'id', autoIncrement: true, indexes: ['workplaceId'] },
  assessments:  { keyPath: 'id', autoIncrement: true, indexes: ['workplaceId', 'tarih'] },
  risks:        { keyPath: 'id', autoIncrement: true, indexes: ['assessmentId', 'riskSkoru'] },
  media:        { keyPath: 'id', autoIncrement: true, indexes: ['riskId', 'assessmentId'] },
  documents:    { keyPath: 'id', autoIncrement: true, indexes: ['workplaceId', 'tip'] },
  team:         { keyPath: 'id', autoIncrement: true, indexes: ['assessmentId'] },
  compliance:   { keyPath: 'id', autoIncrement: true, indexes: ['assessmentId'] }
};

let dbInstance = null;

/**
 * IDBRequest'i Promise'e çeviren yardımcı
 */
function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * İşlem (transaction) üzerinden object store al
 */
function getStore(storeName, mode = 'readonly') {
  const tx = dbInstance.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

export const db = {
  /**
   * Veritabanını aç / oluştur
   */
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        for (const [name, config] of Object.entries(STORES)) {
          if (!database.objectStoreNames.contains(name)) {
            const store = database.createObjectStore(name, {
              keyPath: config.keyPath,
              autoIncrement: config.autoIncrement
            });
            for (const idx of config.indexes) {
              store.createIndex(idx, idx, { unique: false });
            }
          }
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Kayıt ekle, eklenen id'yi döndür
   */
  add(storeName, data) {
    const store = getStore(storeName, 'readwrite');
    return promisify(store.add(data));
  },

  /**
   * ID ile kayıt getir
   */
  get(storeName, id) {
    const store = getStore(storeName, 'readonly');
    return promisify(store.get(id));
  },

  /**
   * Tüm kayıtları getir
   */
  getAll(storeName) {
    const store = getStore(storeName, 'readonly');
    return promisify(store.getAll());
  },

  /**
   * İndeks üzerinden filtreleyerek getir
   */
  getAllByIndex(storeName, indexName, value) {
    const store = getStore(storeName, 'readonly');
    const index = store.index(indexName);
    return promisify(index.getAll(value));
  },

  /**
   * Kaydı güncelle (data.id zorunlu)
   */
  update(storeName, data) {
    const store = getStore(storeName, 'readwrite');
    return promisify(store.put(data));
  },

  /**
   * ID ile kayıt sil
   */
  delete(storeName, id) {
    const store = getStore(storeName, 'readwrite');
    return promisify(store.delete(id));
  },

  /**
   * Depoyu tamamen temizle
   */
  clear(storeName) {
    const store = getStore(storeName, 'readwrite');
    return promisify(store.clear());
  }
};
