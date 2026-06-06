// ui-components.js
// Uygulama UI bileşenleri: Toast bildirimler, Modallar ve DOM yardımcıları

/**
 * Toast bildirim gösterir
 * @param {string} message - Bildirim mesajı
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Ekranda kalma süresi (ms)
 */
export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300); // css animation duration
  }, duration);
}

/**
 * Modal dialog gösterir
 * @param {string} title - Modal başlığı
 * @param {string|HTMLElement} content - Modal içeriği (HTML string veya DOM elementi)
 * @param {Array} buttons - { text, type, onClick, id } nesneleri dizisi
 * @returns {Object} { close: function }
 */
export function showModal(title, content, buttons = []) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  
  const titleEl = document.createElement('h3');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '✕';
  closeBtn.onclick = closeModal;
  
  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  
  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';
  
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }
  
  modal.appendChild(header);
  modal.appendChild(body);
  
  // Footer (Buttons)
  if (buttons && buttons.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    buttons.forEach(btnInfo => {
      const btn = document.createElement('button');
      btn.className = `btn ${btnInfo.type === 'primary' ? 'btn-primary' : 'btn-secondary'}`;
      btn.textContent = btnInfo.text;
      if (btnInfo.id) btn.id = btnInfo.id;
      
      btn.onclick = () => {
        if (btnInfo.onClick) {
          const keepOpen = btnInfo.onClick(overlay);
          if (keepOpen !== true) closeModal();
        } else {
          closeModal();
        }
      };
      
      footer.appendChild(btn);
    });
    
    modal.appendChild(footer);
  }
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Animasyon için frame bekle
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });
  
  function closeModal() {
    overlay.classList.remove('active');
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }
  
  // Dışarı tıklama ile kapatma
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  return {
    close: closeModal,
    element: overlay
  };
}

/**
 * Yükleme (loading) overlay'i gösterir/gizler
 * @param {boolean} show - Göster (true) veya gizle (false)
 * @param {string} text - Yükleme metni
 */
export function toggleLoading(show, text = 'Yükleniyor...') {
  let loader = document.getElementById('global-loader');
  
  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.className = 'modal-overlay active';
      loader.style.zIndex = '9999';
      
      loader.innerHTML = `
        <div style="background: var(--bg-surface); padding: 30px; border-radius: var(--border-radius); text-align: center; border: 1px solid var(--border-color);">
          <div class="ai-loading-spinner" style="margin: 0 auto 15px auto;"></div>
          <div style="font-weight: 600; color: var(--text-primary);" id="global-loader-text">${text}</div>
        </div>
      `;
      document.body.appendChild(loader);
    } else {
      document.getElementById('global-loader-text').textContent = text;
      loader.classList.add('active');
    }
  } else {
    if (loader) {
      loader.classList.remove('active');
      setTimeout(() => {
        if (document.body.contains(loader)) {
          document.body.removeChild(loader);
        }
      }, 300);
    }
  }
}

/**
 * Onay dialogu gösterir
 * @param {string} message - Sorulacak soru
 * @returns {Promise<boolean>}
 */
export function confirmDialog(message) {
  return new Promise((resolve) => {
    showModal('Onay', message, [
      { text: 'İptal', type: 'secondary', onClick: () => resolve(false) },
      { text: 'Evet, Onaylıyorum', type: 'primary', onClick: () => resolve(true) }
    ]);
  });
}

/**
 * DOM elementi oluşturmak için yardımcı fonksiyon
 * @param {string} tag - Etiket (örn: 'div')
 * @param {Object} attributes - Element özellikleri (className, id vb.)
 * @param {Array|string|HTMLElement} children - İçerik
 * @returns {HTMLElement}
 */
export function createElement(tag, attributes = {}, children = []) {
  const el = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataVal]) => {
        el.dataset[dataKey] = dataVal;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  if (!Array.isArray(children)) {
    children = [children];
  }
  
  children.forEach(child => {
    if (child == null) return;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof HTMLElement) {
      el.appendChild(child);
    }
  });
  
  return el;
}
