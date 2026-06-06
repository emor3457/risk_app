// media-handler.js — Medya yakalama ve yönetim modülü
// Fotoğraf, video, ses kaydı işlemleri (mobil + masaüstü)

/**
 * Dinamik file input oluşturup kullanıcıdan dosya(lar) alır
 * @param {string} accept - Kabul edilen dosya türleri
 * @param {string} [capture] - Mobil kamera yönü ('environment' | 'user')
 * @param {boolean} [multiple] - Birden fazla dosya seçimi
 * @returns {Promise<File|File[]>}
 */
function pickFile(accept, capture, multiple = false) {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        if (capture) input.setAttribute('capture', capture);
        if (multiple) input.setAttribute('multiple', 'multiple');

        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                resolve(multiple ? Array.from(input.files) : input.files[0]);
            } else {
                reject(new Error('Dosya seçilmedi'));
            }
        });

        // Kullanıcı iptal ederse
        input.addEventListener('cancel', () => reject(new Error('Dosya seçimi iptal edildi')));

        input.click();
    });
}

/**
 * Blob → base64 string (data URL prefix'siz)
 */
export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // "data:image/jpeg;base64,/9j/..." → "/9j/..." kısmını al
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('Blob base64 dönüşümü başarısız'));
        reader.readAsDataURL(blob);
    });
}

/**
 * Görüntü blob'undan küçük resim (thumbnail) oluşturur
 * @param {Blob} blob - Görüntü blob'u
 * @param {number} [maxWidth=200] - Maksimum genişlik
 * @returns {Promise<string>} base64 thumbnail
 */
export function createThumbnail(blob, maxWidth = 200) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            const ratio = maxWidth / img.width;
            const width = Math.min(img.width, maxWidth);
            const height = img.width <= maxWidth ? img.height : img.height * ratio;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            URL.revokeObjectURL(url);
            // Thumbnail base64 (prefix'siz)
            const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            resolve(base64);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Thumbnail oluşturulamadı'));
        };

        img.src = url;
    });
}

/**
 * Fotoğraf çeker (mobilde kamera açılır, masaüstünde dosya seçici)
 * @returns {Promise<{blob: Blob, base64: string, mimeType: string, thumbnail: string}>}
 */
export async function capturePhoto() {
    const file = await pickFile('image/*', 'environment');
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const base64 = await blobToBase64(blob);
    const thumbnail = await createThumbnail(blob);

    return {
        blob,
        base64,
        mimeType: file.type || 'image/jpeg',
        thumbnail
    };
}

/**
 * Video çeker (mobilde kamera açılır)
 * @returns {Promise<{blob: Blob, base64: string, mimeType: string}>}
 */
export async function captureVideo() {
    const file = await pickFile('video/*', 'environment');
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const base64 = await blobToBase64(blob);

    return {
        blob,
        base64,
        mimeType: file.type || 'video/mp4'
    };
}

/**
 * Ses kaydedici oluşturur (MediaRecorder API)
 * @returns {{start: Function, stop: Function, isRecording: boolean, onComplete: Function|null, onError: Function|null}}
 */
export function createAudioRecorder() {
    let mediaRecorder = null;
    let chunks = [];
    let startTime = 0;
    let _isRecording = false;

    const recorder = {
        get isRecording() { return _isRecording; },

        /** Kayıt bitince çağrılacak callback: ({ blob, base64, mimeType, duration }) */
        onComplete: null,

        /** Hata callback'i: (error) */
        onError: null,

        async start() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mimeType = getSupportedMimeTypes().audio[0] || '';
                const options = mimeType ? { mimeType } : {};

                mediaRecorder = new MediaRecorder(stream, options);
                chunks = [];
                startTime = Date.now();
                _isRecording = true;

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                mediaRecorder.onstop = async () => {
                    _isRecording = false;
                    const duration = (Date.now() - startTime) / 1000; // saniye
                    const actualMime = mediaRecorder.mimeType || 'audio/webm';
                    const blob = new Blob(chunks, { type: actualMime });

                    // Stream track'leri durdur (mikrofonu serbest bırak)
                    stream.getTracks().forEach(t => t.stop());

                    if (recorder.onComplete) {
                        const base64 = await blobToBase64(blob);
                        recorder.onComplete({ blob, base64, mimeType: actualMime, duration });
                    }
                };

                mediaRecorder.onerror = (e) => {
                    _isRecording = false;
                    stream.getTracks().forEach(t => t.stop());
                    if (recorder.onError) recorder.onError(e.error || new Error('Kayıt hatası'));
                };

                mediaRecorder.start();
            } catch (err) {
                _isRecording = false;
                if (recorder.onError) recorder.onError(err);
            }
        },

        stop() {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        }
    };

    return recorder;
}

/**
 * Ses kaydedici (eski API uyumluluğu için — controller objesi döner)
 * @returns {Promise<{start: Function, stop: Function, getBlob: Function}>}
 */
export async function recordAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedMimeTypes().audio[0] || '';
    const options = mimeType ? { mimeType } : {};
    const mediaRecorder = new MediaRecorder(stream, options);
    let chunks = [];
    let resolveBlob;
    let blobPromise = new Promise(r => { resolveBlob = r; });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        resolveBlob(blob);
    };

    return {
        start() { mediaRecorder.start(); },
        stop() { mediaRecorder.stop(); },
        getBlob() { return blobPromise; }
    };
}

/**
 * Dosya boyutunu okunabilir formata çevirir
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    return `${size} ${units[i]}`;
}

/**
 * Tarayıcının desteklediği ses/video MIME türlerini döner
 * @returns {{audio: string[], video: string[]}}
 */
export function getSupportedMimeTypes() {
    const audioTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    const videoTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];

    const check = (types) => types.filter(t => {
        try { return MediaRecorder.isTypeSupported(t); }
        catch { return false; }
    });

    return {
        audio: check(audioTypes),
        video: check(videoTypes)
    };
}

/**
 * Galeriden bir veya birden fazla resim/video seçer
 * @returns {Promise<Array<{blob: Blob, base64: string, mimeType: string, thumbnail?: string, type: string}>>}
 */
export async function pickFromGallery() {
    const files = await pickFile('image/*,video/*', null, true);
    const fileArray = Array.isArray(files) ? files : [files];
    const results = [];
    
    for (const file of fileArray) {
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        const base64 = await blobToBase64(blob);
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        
        const item = {
            blob,
            base64,
            mimeType: file.type,
            type
        };
        
        if (type === 'image') {
            item.thumbnail = await createThumbnail(blob);
        }
        
        results.push(item);
    }
    
    return results;
}
