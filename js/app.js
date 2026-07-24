// app.js
// Ana Uygulama Mantığı ve SPA Router

import { db } from './database.js';
import * as FineKinney from './fine-kinney.js';
import * as GeminiAPI from './gemini-api.js';
import * as MediaHandler from './media-handler.js';
import * as Compliance from './compliance-checker.js';
import * as ExcelExport from './excel-export.js';
import { showToast, showModal, toggleLoading, confirmDialog, createElement } from './ui-components.js';

// Global State
const state = {
  currentWorkplaceId: null,
  currentAssessmentId: null,
  currentRiskId: null, // düzenleme için
  aiResults: null,     // son AI analizi
  mediaQueue: [],      // yüklenecek medyalar
};

// ==========================================
// Router & Navigasyon
// ==========================================

function navigateTo(sectionId) {
  // Aktif bölümü gizle
  document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
  
  // Yeni bölümü göster
  const section = document.getElementById(sectionId);
  if (section) section.classList.add('active');
  
  // Menü aktifliğini ayarla
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(el => {
    el.classList.remove('active');
    if (el.dataset.target === sectionId) {
      el.classList.add('active');
    }
  });

  // Sayfa özel yükleme mantığı
  if (sectionId === 'page-dashboard') loadDashboard();
  else if (sectionId === 'page-workplace') loadWorkplaces();
  else if (sectionId === 'page-assessments') loadAssessments();
  else if (sectionId === 'page-settings') loadSettings();
  
  // Mobil menüyü kapat
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && window.innerWidth <= 768) {
    sidebar.classList.remove('open');
  }
}

function initRouter() {
  document.querySelectorAll('[data-target]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.target);
    });
  });
  
  // Mobil menü toggle
  const menuToggle = document.getElementById('mobile-menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('open');
    });
  }
}

// ==========================================
// Dashboard (Ana Ekran)
// ==========================================

async function loadDashboard() {
  try {
    const workplaces = await db.getAll('workplaces');
    const assessments = await db.getAll('assessments');
    const risks = await db.getAll('risks');
    
    document.getElementById('stat-workplaces').textContent = workplaces.length;
    document.getElementById('stat-assessments').textContent = assessments.length;
    document.getElementById('stat-risks').textContent = risks.length;
    
    // Yüksek riskli sayısını bul
    const highRisks = risks.filter(r => r.riskSkoru > 200).length;
    document.getElementById('stat-high-risks').textContent = highRisks;
    
  } catch (error) {
    console.error('Dashboard hatası:', error);
    showToast('Veriler yüklenirken hata oluştu', 'error');
  }
}

// ==========================================
// Ayarlar (API Key)
// ==========================================

function loadSettings() {
  const apiKey = GeminiAPI.getApiKey();
  const apiKeyInput = document.getElementById('settings-api-key');
  if (apiKeyInput && apiKey) {
    apiKeyInput.value = apiKey;
  }
  
  const modelsContainer = document.getElementById('settings-models');
  if (modelsContainer) {
    modelsContainer.innerHTML = '';
    const selectedModel = GeminiAPI.getSelectedModel();
    
    GeminiAPI.MODELS.forEach(model => {
      const isSelected = model.id === selectedModel;
      
      const option = createElement('label', { 
        className: `model-option ${isSelected ? 'selected' : ''}` 
      }, [
        createElement('div', { className: 'model-radio' }),
        createElement('input', { 
          type: 'radio', 
          name: 'ai_model', 
          value: model.id,
          checked: isSelected,
          onchange: (e) => {
            document.querySelectorAll('.model-option').forEach(el => el.classList.remove('selected'));
            e.target.closest('.model-option').classList.add('selected');
            GeminiAPI.setSelectedModel(model.id);
            showToast('Model seçimi güncellendi', 'success');
          }
        }),
        createElement('div', { className: 'model-info' }, [
          createElement('div', { className: 'model-name' }, model.name),
          createElement('div', { className: 'model-desc' }, model.description)
        ]),
        createElement('div', { 
          className: `model-badge ${model.free ? 'free' : 'paid'}` 
        }, model.free ? 'Ücretsiz' : 'Ücretli')
      ]);
      
      modelsContainer.appendChild(option);
    });
  }
}

document.getElementById('btn-save-settings')?.addEventListener('click', async () => {
  const apiKey = document.getElementById('settings-api-key').value.trim();
  
  if (!apiKey) {
    showToast('Lütfen geçerli bir API anahtarı girin', 'error');
    return;
  }
  
  toggleLoading(true, 'Bağlantı test ediliyor...');
  const testResult = await GeminiAPI.testConnection(apiKey);
  toggleLoading(false);
  
  if (testResult.success) {
    GeminiAPI.setApiKey(apiKey);
    showToast('API Anahtarı başarıyla kaydedildi ve doğrulandı', 'success');
  } else {
    showToast(`Hata: ${testResult.error}`, 'error');
  }
});

// ==========================================
// İşyeri Yönetimi
// ==========================================

async function loadWorkplaces() {
  const container = document.getElementById('workplaces-list');
  if (!container) return;
  
  try {
    const workplaces = await db.getAll('workplaces');
    
    if (workplaces.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏢</div>
          <div class="empty-state-title">Kayıtlı işyeri bulunamadı</div>
          <div class="empty-state-desc">Risk değerlendirmesi yapmak için önce bir işyeri ekleyin.</div>
          <button class="btn btn-primary" onclick="window.showWorkplaceModal()">Yeni İşyeri Ekle</button>
        </div>
      `;
      return;
    }
    
    let html = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <h3>İşyerleri</h3>
        <button class="btn btn-primary btn-sm" onclick="window.showWorkplaceModal()">+ Yeni Ekle</button>
      </div>
      <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
    `;
    
    workplaces.forEach(wp => {
      html += `
        <div class="card card-glass">
          <div class="card-header">
            <div class="card-title">${wp.isverenAdi || 'İsimsiz İşyeri'}</div>
          </div>
          <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
            <div><strong>Sorgu/Proje:</strong> ${wp.sorguBirimProje || '-'}</div>
            <div><strong>NACE:</strong> ${wp.naceKodu || '-'}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm flex-1" onclick="window.startAssessment(${wp.id})">Değerlendirme Başlat</button>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
  } catch (error) {
    console.error(error);
    showToast('İşyerleri yüklenemedi', 'error');
  }
}

window.showWorkplaceModal = () => {
  const formHtml = `
    <form id="workplace-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">İşveren Adı <span class="required">*</span></label>
          <input type="text" id="wp-isveren" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Sorgu/Birim/Proje</label>
          <input type="text" id="wp-proje" class="form-input">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Doküman No</label>
          <input type="text" id="wp-dokuman" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">Tarih</label>
          <input type="date" id="wp-tarih" class="form-input" value="${new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">NACE Kodu & Tehlike Sınıfı</label>
        <input type="text" id="wp-nace" class="form-input" placeholder="Örn: 41.20.02 - Çok Tehlikeli">
      </div>
    </form>
  `;
  
  showModal('Yeni İşyeri Ekle', formHtml, [
    { text: 'İptal', type: 'secondary' },
    { 
      text: 'Kaydet', 
      type: 'primary',
      onClick: async (overlay) => {
        const isveren = document.getElementById('wp-isveren').value.trim();
        if (!isveren) {
          showToast('İşveren adı zorunludur', 'error');
          return true; // Modal'ı açık tut
        }
        
        try {
          await db.add('workplaces', {
            isverenAdi: isveren,
            sorguBirimProje: document.getElementById('wp-proje').value,
            dokumanNo: document.getElementById('wp-dokuman').value,
            olusturmaTarihi: document.getElementById('wp-tarih').value,
            naceKodu: document.getElementById('wp-nace').value,
            revNo: '00',
            revTarihi: '-',
            yenilemeTarihi: '-'
          });
          
          showToast('İşyeri eklendi', 'success');
          loadWorkplaces();
          return false; // Kapat
        } catch (err) {
          showToast('Kaydedilirken hata oluştu', 'error');
          return true;
        }
      }
    }
  ]);
};

// ==========================================
// Değerlendirme & Analiz Akışı
// ==========================================

window.startAssessment = async (workplaceId) => {
  try {
    const assessmentId = await db.add('assessments', {
      workplaceId,
      tarih: new Date().toISOString()
    });
    
    state.currentWorkplaceId = workplaceId;
    state.currentAssessmentId = assessmentId;
    state.currentRiskId = null;
    
    navigateTo('page-analyzer');
    initAnalyzerPage();
  } catch (error) {
    console.error(error);
    showToast('Değerlendirme başlatılamadı', 'error');
  }
};

function initAnalyzerPage() {
  document.getElementById('analyzer-media-preview').innerHTML = '';
  document.getElementById('analyzer-results').classList.add('hidden');
  document.getElementById('analyzer-form').classList.remove('hidden');
  state.mediaQueue = [];
}

// Medya Yakalama Butonları
document.getElementById('btn-capture-photo')?.addEventListener('click', async () => {
  try {
    const photo = await MediaHandler.capturePhoto();
    addMediaToQueue(photo, 'image');
  } catch (err) {
    if (err.message !== 'Dosya seçilmedi') showToast('Kamera açılamadı: ' + err.message, 'error');
  }
});

document.getElementById('btn-capture-video')?.addEventListener('click', async () => {
  try {
    const video = await MediaHandler.captureVideo();
    addMediaToQueue(video, 'video');
  } catch (err) {
    if (err.message !== 'Dosya seçilmedi') showToast('Video açılamadı: ' + err.message, 'error');
  }
});

document.getElementById('btn-select-gallery')?.addEventListener('click', async () => {
  try {
    const files = await MediaHandler.pickFromGallery();
    files.forEach(f => addMediaToQueue(f, f.type));
  } catch (err) {
    if (err.message !== 'Dosya seçilmedi') showToast('Galeri hatası: ' + err.message, 'error');
  }
});

function addMediaToQueue(mediaObj, type) {
  state.mediaQueue.push({ ...mediaObj, type });
  renderMediaQueue();
}

function renderMediaQueue() {
  const container = document.getElementById('analyzer-media-preview');
  container.innerHTML = '';
  
  if (state.mediaQueue.length > 0) {
    container.innerHTML = '<h4>Eklendi:</h4><div class="media-grid" id="media-grid-content"></div>';
    const grid = document.getElementById('media-grid-content');
    
    state.mediaQueue.forEach((media, index) => {
      const item = document.createElement('div');
      item.className = 'media-thumb';
      
      if (media.type === 'image') {
        item.innerHTML = `
          <img src="${media.thumbnail || 'data:'+media.mimeType+';base64,'+media.base64}">
          <div class="media-thumb-type">📸</div>
          <button class="modal-close" style="position:absolute; top:4px; right:4px; width:24px; height:24px; background:rgba(0,0,0,0.5); color:white; font-size:12px;" onclick="window.removeMedia(${index})">✕</button>
        `;
      } else if (media.type === 'video') {
        item.innerHTML = `
          <div style="width:100%; height:100%; background:#333; display:flex; align-items:center; justify-content:center;">🎬 Video</div>
          <div class="media-thumb-type">🎥</div>
          <button class="modal-close" style="position:absolute; top:4px; right:4px; width:24px; height:24px; background:rgba(0,0,0,0.5); color:white; font-size:12px;" onclick="window.removeMedia(${index})">✕</button>
        `;
      }
      grid.appendChild(item);
    });
  }
}

window.removeMedia = (index) => {
  state.mediaQueue.splice(index, 1);
  renderMediaQueue();
};

// AI Analiz Başlatma
document.getElementById('btn-analyze')?.addEventListener('click', async () => {
  const apiKey = GeminiAPI.getApiKey();
  if (!apiKey) {
    showToast('Lütfen önce ayarlardan API anahtarı girin!', 'error');
    navigateTo('page-settings');
    return;
  }
  
  const textContext = document.getElementById('analyzer-text-input').value.trim();
  const departman = document.getElementById('analyzer-departman').value.trim();
  const focus = document.getElementById('analyzer-focus').value;
  const limit = document.getElementById('analyzer-limit').value;
  
  if (state.mediaQueue.length === 0 && !textContext) {
    showToast('Analiz için en az bir fotoğraf veya metin girmelisiniz.', 'warning');
    return;
  }
  
  const context = `Departman/Süreç: ${departman || 'Belirtilmedi'}\nEk Notlar: ${textContext}`;
  
  toggleLoading(true, 'Gemini AI analiz ediyor... Lütfen bekleyin.');
  
  try {
    let result = null;
    
    // Kuyruktaki tüm medya dosyalarını hazırla (videolar için kareleri çıkar)
    if (state.mediaQueue.length > 0) {
      const mediaItems = [];
      for (const m of state.mediaQueue) {
        if (m.type === 'image') {
          mediaItems.push({ base64: m.base64, mimeType: m.mimeType });
        } else if (m.type === 'video') {
          const frames = await GeminiAPI.extractVideoFrames(m.blob, 3);
          mediaItems.push(...frames);
        }
      }
      result = await GeminiAPI.analyzeMultipleMedia(mediaItems, context, focus, limit);
    } else {
      // Sadece metin
      result = await GeminiAPI.analyzeText(context, focus, limit);
    }
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    state.aiResults = result;
    renderAiResults(result);
    
    document.getElementById('analyzer-form').classList.add('hidden');
    document.getElementById('analyzer-results').classList.remove('hidden');
    
  } catch (error) {
    console.error(error);
    showToast('Analiz hatası: ' + error.message, 'error');
  } finally {
    toggleLoading(false);
  }
});

function renderAiResults(data) {
  const container = document.getElementById('ai-results-container');
  container.innerHTML = '';
  
  if (data.genelDegerlendirme) {
    container.innerHTML += `
      <div style="background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; padding: 12px; margin-bottom: 20px; font-size: 14px;">
        <strong>Genel Durum:</strong> ${data.genelDegerlendirme}
      </div>
    `;
  }
  
  if (data.tehlikeler && data.tehlikeler.length > 0) {
    data.tehlikeler.forEach((t, i) => {
      const score1 = FineKinney.calculateRiskScore(t.olasilik || 1, t.frekans || 1, t.siddet || 1);
      const level1 = FineKinney.getRiskLevel(score1);
      
      const card = createElement('div', { className: 'ai-card' }, [
        createElement('div', { className: 'ai-card-header' }, [
          createElement('div', { className: 'ai-label' }, `Tehlike Tespiti #${i+1}`),
          createElement('div', { className: 'risk-badge', style: `background: ${level1.color}22; color: ${level1.color};` }, `Skor: ${score1} - ${level1.level}`)
        ]),
        createElement('div', { className: 'ai-card-body' }, [
          createAiField('Tehlike Tanımı', t.tehlikeTanimi),
          createAiField('Tehlike Kaynağı', t.tehlikeKaynagi),
          createAiField('Risk', t.risk),
          createAiField('İlgili Mevzuat', t.ilgiliMevzuat),
          createAiField('Mevcut Durum', t.mevcutDurum),
          createAiField('İlave Aksiyon', t.ilaveAksiyon)
        ]),
        createElement('div', { className: 'ai-card-actions' }, [
          createElement('button', { 
            className: 'btn btn-primary btn-sm btn-block',
            onclick: () => editAndSaveRisk(t, i) 
          }, 'İncele ve Kaydet')
        ])
      ]);
      container.appendChild(card);
    });
  } else {
    container.innerHTML += '<p>Tehlike tespit edilemedi.</p>';
  }
  
  // Uyum gerekliliklerini ComplianceChecker'a gönder ve state'e kaydet (Şimdilik mock veya direk db)
  if (data.pikselerdenTespitler) {
    const reqs = [];
    if (data.pikselerdenTespitler.msdsGerekli) reqs.push('MSDS');
    if (data.pikselerdenTespitler.kullanmaTalimatiGerekli) reqs.push('Kullanma Talimatı');
    if (data.pikselerdenTespitler.kkdGerekli) reqs.push('KKD');
    
    if (reqs.length > 0) {
      showToast(`Uyarı: Yönetmelik gereği eksikler olabilir (${reqs.join(', ')})`, 'warning', 5000);
    }
  }
}

function createAiField(label, value) {
  return createElement('div', { className: 'ai-card-field' }, [
    createElement('div', { className: 'ai-card-field-label' }, label),
    createElement('div', { className: 'ai-card-field-value' }, value || '-')
  ]);
}

window.editAndSaveRisk = (aiData, index) => {
  const formHtml = `
    <form id="risk-edit-form">
      <div class="form-group">
        <label class="form-label">Süreç / Departman</label>
        <input type="text" id="r-surec" class="form-input" value="${document.getElementById('analyzer-departman').value}">
      </div>
      <div class="form-group">
        <label class="form-label">Tehlike Tanımı</label>
        <input type="text" id="r-tehlike-tanimi" class="form-input" value="${aiData.tehlikeTanimi || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Tehlike Kaynağı</label>
        <input type="text" id="r-tehlike-kaynagi" class="form-input" value="${aiData.tehlikeKaynagi || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Risk</label>
        <input type="text" id="r-risk" class="form-input" value="${aiData.risk || ''}">
      </div>
      
      <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin: 15px 0;">
        <h4 style="margin-top:0; color:#334155; font-size:14px; border-bottom:1px solid #cbd5e1; padding-bottom:5px;">Mevcut Durum Puanlaması</h4>
        <div class="form-group">
          <label class="form-label">Mevcut Durum Açıklaması</label>
          <textarea id="r-mevcut" class="form-textarea">${aiData.mevcutDurum || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Olasılık (O₁)</label>
            <select id="r-o1" class="form-select">
              ${FineKinney.OLASILIK_SCALE.map(s => `<option value="${s.value}" ${s.value == aiData.olasilik ? 'selected' : ''}>${s.value} - ${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Frekans (F₁)</label>
            <select id="r-f1" class="form-select">
              ${FineKinney.FREKANS_SCALE.map(s => `<option value="${s.value}" ${s.value == aiData.frekans ? 'selected' : ''}>${s.value} - ${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Şiddet (Ş₁)</label>
            <select id="r-s1" class="form-select">
              ${FineKinney.SIDDET_SCALE.map(s => `<option value="${s.value}" ${s.value == aiData.siddet ? 'selected' : ''}>${s.value} - ${s.label}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">İlgili Mevzuat / Yönetmelik ve Maddesi</label>
        <input type="text" id="r-mevzuat" class="form-input" value="${aiData.ilgiliMevzuat || ''}">
      </div>

      <div style="background:#f0fdf4; padding:10px; border-radius:8px; margin: 15px 0;">
        <h4 style="margin-top:0; color:#166534; font-size:14px; border-bottom:1px solid #bbf7d0; padding-bottom:5px;">Önlem Sonrası Puanlama</h4>
        <div class="form-group">
          <label class="form-label">İlave Aksiyon</label>
          <textarea id="r-onlem" class="form-textarea">${aiData.ilaveAksiyon || aiData.alinanOnlem || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Olasılık (O₂)</label>
            <select id="r-o2" class="form-select">
              ${FineKinney.OLASILIK_SCALE.map(s => `<option value="${s.value}" ${s.value == aiData.onlemSonrasiOlasilik ? 'selected' : ''}>${s.value} - ${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Frekans (F₂)</label>
            <select id="r-f2" class="form-select">
              ${FineKinney.FREKANS_SCALE.map(s => `<option value="${s.value}" ${s.value == aiData.onlemSonrasiFrekans ? 'selected' : ''}>${s.value} - ${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Şiddet (Ş₂)</label>
            <select id="r-s2" class="form-select">
              ${FineKinney.SIDDET_SCALE.map(s => `<option value="${s.value}" ${s.value == aiData.onlemSonrasiSiddet ? 'selected' : ''}>${s.value} - ${s.label}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    </form>
  `;
  
  showModal('Riski İncele ve Kaydet', formHtml, [
    { text: 'İptal', type: 'secondary' },
    { 
      text: 'Veritabanına Kaydet', 
      type: 'primary',
      onClick: async () => {
        const o1 = parseFloat(document.getElementById('r-o1').value);
        const f1 = parseFloat(document.getElementById('r-f1').value);
        const s1 = parseFloat(document.getElementById('r-s1').value);
        const skor1 = FineKinney.calculateRiskScore(o1, f1, s1);
        
        const o2 = parseFloat(document.getElementById('r-o2').value);
        const f2 = parseFloat(document.getElementById('r-f2').value);
        const s2 = parseFloat(document.getElementById('r-s2').value);
        const skor2 = FineKinney.calculateRiskScore(o2, f2, s2);
        
        try {
          await db.add('risks', {
            assessmentId: state.currentAssessmentId,
            siraNo: index + 1,
            surecPozisyonDepartman: document.getElementById('r-surec').value,
            tehlikeTanimi: document.getElementById('r-tehlike-tanimi').value,
            tehlikeKaynagi: document.getElementById('r-tehlike-kaynagi').value,
            risk: document.getElementById('r-risk').value,
            ilgiliMevzuat: document.getElementById('r-mevzuat').value,
            mevcutDurum: document.getElementById('r-mevcut').value,
            olasilik: o1,
            frekans: f1,
            siddet: s1,
            riskSkoru: skor1,
            ilaveAksiyon: document.getElementById('r-onlem').value,
            onlemSonrasiOlasilik: o2,
            onlemSonrasiFrekans: f2,
            onlemSonrasiSiddet: s2,
            onlemSonrasiRiskSkoru: skor2,
            dof: ExcelExport.generateDOFNumber(),
            sorumlu: 'İSG Uzmanı',
            terminTarihi: '',
            durum: 'Açık'
          });
          
          showToast('Risk kaydedildi!', 'success');
          return false; // modal kapat
        } catch (err) {
          showToast('Kaydedilemedi: ' + err.message, 'error');
          return true;
        }
      }
    }
  ]);
};

document.getElementById('btn-new-analysis')?.addEventListener('click', () => {
  initAnalyzerPage();
});

document.getElementById('btn-manual-risk')?.addEventListener('click', async () => {
  if (!state.currentAssessmentId) {
    showToast('Lütfen önce bir değerlendirme başlatın.', 'error');
    return;
  }
  
  try {
    const risks = await db.getAllByIndex('risks', 'assessmentId', state.currentAssessmentId);
    const nextIndex = risks.length;
    window.editAndSaveRisk({}, nextIndex);
  } catch(err) {
    showToast('Hata: ' + err.message, 'error');
  }
});

document.getElementById('btn-finish-assessment')?.addEventListener('click', async () => {
  try {
    const risks = await db.getAllByIndex('risks', 'assessmentId', state.currentAssessmentId);
    if (risks.length === 0) {
      const ok = await confirmDialog('Hiç risk kaydetmediniz. Yine de bitirmek istiyor musunuz?');
      if (!ok) return;
    }
    
    showToast('Değerlendirme tamamlandı', 'success');
    navigateTo('page-assessments');
  } catch (err) {
    showToast('Hata: ' + err.message, 'error');
  }
});

// ==========================================
// Raporlar & Excel
// ==========================================

async function loadAssessments() {
  const container = document.getElementById('assessments-list');
  if (!container) return;
  
  try {
    const assessments = await db.getAll('assessments');
    const workplaces = await db.getAll('workplaces');
    
    if (assessments.length === 0) {
      container.innerHTML = '<div class="empty-state">Henüz değerlendirme yok.</div>';
      return;
    }
    
    let html = '<div class="grid" style="display: grid; gap: 16px;">';
    
    for (const ast of assessments) {
      const wp = workplaces.find(w => w.id === ast.workplaceId) || {};
      const risks = await db.getAllByIndex('risks', 'assessmentId', ast.id);
      
      const dateStr = new Date(ast.tarih).toLocaleDateString('tr-TR');
      
      html += `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${wp.isverenAdi || 'Bilinmiyor'}</div>
            <div style="font-size:12px; color:var(--text-muted);">${dateStr}</div>
          </div>
          <div style="margin-bottom: 16px;">
            <div class="risk-badge" style="background:var(--bg-surface-2); color:white;">Toplam ${risks.length} Risk</div>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <button class="btn btn-secondary flex-1" onclick="window.resumeAssessment(${ast.id}, ${ast.workplaceId})" style="padding: 8px;">
              ✏️ Devam Et
            </button>
            <button class="btn btn-secondary flex-1" onclick="window.deleteAssessment(${ast.id})" style="padding: 8px; color: var(--risk-high); border-color: var(--risk-high);">
              🗑️ Sil
            </button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary flex-1" onclick="window.viewAssessment(${ast.id})" style="padding: 10px 8px;">
              👁️ Görüntüle
            </button>
            <button class="btn btn-success flex-1" onclick="window.exportAssessment(${ast.workplaceId}, ${ast.id})" style="padding: 10px 8px;">
              📊 Excel İndir
            </button>
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
  } catch (err) {
    console.error(err);
  }
}

window.deleteAssessment = async (astId) => {
  const ok = await confirmDialog('Bu raporu ve içindeki tüm tespitleri kalıcı olarak silmek istediğinize emin misiniz?');
  if (!ok) return;

  try {
    await db.delete('assessments', astId);
    
    const risks = await db.getAllByIndex('risks', 'assessmentId', astId);
    for (const r of risks) {
      await db.delete('risks', r.id);
    }
    
    showToast('Rapor başarıyla silindi.', 'success');
    loadAssessments(); // Listeyi yenile
  } catch (err) {
    showToast('Silinirken hata oluştu: ' + err.message, 'error');
  }
};

window.resumeAssessment = (astId, wpId) => {
  state.currentAssessmentId = astId;
  state.currentWorkplaceId = wpId;
  
  navigateTo('page-analyzer');
  initAnalyzerPage();
  showToast('Çalışmaya geri dönüldü. Devam edebilirsiniz.', 'success');
};

window.viewAssessment = async (astId) => {
  try {
    const risks = await db.getAllByIndex('risks', 'assessmentId', astId);
    
    if (risks.length === 0) {
      showToast('Bu değerlendirmeye ait kayıtlı risk bulunamadı.', 'warning');
      return;
    }

    let risksHtml = '<div style="max-height:60vh; overflow-y:auto; padding-right:8px;">';
    risks.forEach((r, idx) => {
      const level = FineKinney.getRiskLevel(r.riskSkoru);
      risksHtml += `
        <div style="background:var(--bg-surface); padding:12px; margin-bottom:12px; border-radius:8px; border-left:4px solid ${level.color}">
          <div style="font-weight:600; margin-bottom:4px;">${idx + 1}. ${r.tehlikeTanimi || r.tehlikeKaynagi || '-'}</div>
          <div style="font-size:13px; color:var(--text-muted); margin-bottom:4px;"><strong>Tehlike Kaynağı:</strong> ${r.tehlikeKaynagi || '-'}</div>
          <div style="font-size:13px; color:var(--text-muted); margin-bottom:4px;"><strong>Risk:</strong> ${r.risk || '-'}</div>
          <div style="font-size:13px; color:var(--text-muted); margin-bottom:4px;"><strong>Mevzuat:</strong> ${r.ilgiliMevzuat || '-'}</div>
          <div style="font-size:13px; color:var(--text-muted); margin-bottom:8px;">${r.surecPozisyonDepartman || '-'}</div>
          
          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:8px;">
            <div style="display:flex; gap:8px;">
              <div class="risk-badge" style="background:var(--bg-surface-2)">Mevcut: O:${r.olasilik || '-'} F:${r.frekans || '-'} Ş:${r.siddet || '-'}</div>
              <div class="risk-badge" style="background:${level.color}22; color:${level.color}">Skor₁: ${r.riskSkoru || '-'}</div>
            </div>
            ${r.onlemSonrasiRiskSkoru ? `
            <div style="display:flex; gap:8px;">
              <div class="risk-badge" style="background:var(--bg-surface-2)">Önlem Sonrası: O:${r.onlemSonrasiOlasilik || '-'} F:${r.onlemSonrasiFrekans || '-'} Ş:${r.onlemSonrasiSiddet || '-'}</div>
              <div class="risk-badge" style="background:${FineKinney.getRiskLevel(r.onlemSonrasiRiskSkoru).color}22; color:${FineKinney.getRiskLevel(r.onlemSonrasiRiskSkoru).color}">Skor₂: ${r.onlemSonrasiRiskSkoru}</div>
            </div>
            ` : ''}
          </div>
          
          <div style="font-size:13px; margin-bottom:4px;"><strong>Mevcut Durum:</strong> ${r.mevcutDurum || '-'}</div>
          <div style="font-size:13px;"><strong>Önlem:</strong> ${r.tavsiyeEdilenOnlemler || '-'}</div>
        </div>
      `;
    });
    risksHtml += '</div>';

    showModal('Değerlendirme Raporu', risksHtml, [
      { text: 'Kapat', type: 'secondary', onClick: () => false }
    ]);
  } catch (err) {
    showToast('Rapor açılamadı: ' + err.message, 'error');
  }
};

window.exportAssessment = async (wpId, astId) => {
  try {
    toggleLoading(true, 'Excel raporu oluşturuluyor...');
    
    const workplace = await db.get('workplaces', wpId);
    const risks = await db.getAllByIndex('risks', 'assessmentId', astId);
    
    const assessmentData = {
      workplace: workplace,
      risks: risks,
      compliance: [
        { label: 'MSDS Eğitimleri', durum: 'Sonra eklenecek' },
        { label: 'Makine Kullanma Talimatı', durum: 'Mevcut' },
        { label: 'Acil Durum Planı', durum: 'Eksik' }
      ]
    };
    
    await ExcelExport.exportToExcel(assessmentData);
    showToast('Excel raporu indirildi', 'success');
  } catch (err) {
    console.error(err);
    showToast('Excel oluşturulurken hata: ' + err.message, 'error');
  } finally {
    toggleLoading(false);
  }
};

// ==========================================
// Başlatma (Init)
// ==========================================

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await db.init();
    initRouter();
    loadDashboard(); // İlk sayfa
  } catch (error) {
    console.error('Uygulama başlatılamadı:', error);
    alert('Veritabanı hatası! Lütfen tarayıcınızın gizli sekmede olmadığını kontrol edin.');
  }
});
