// excel-export.js — Excel rapor üreteci (SheetJS / XLSX global)
// IST Risk Değerlendirme Planı şablon formatında .xlsx çıktısı

// ── Sabitler ──

const THIN_BORDER = { style: 'thin', color: { rgb: '000000' } };
const BORDERS_ALL = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };

const STYLE_HEADER = {
    fill: { fgColor: { rgb: 'DC2626' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: BORDERS_ALL
};

const STYLE_COL_HEADER = {
    fill: { fgColor: { rgb: 'DC2626' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: BORDERS_ALL
};

const STYLE_DATA = {
    font: { sz: 10 },
    alignment: { vertical: 'center', wrapText: true },
    border: BORDERS_ALL
};

const STYLE_DATA_CENTER = {
    ...STYLE_DATA,
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
};

/** Sütun genişlikleri (wch = karakter sayısı) */
const COL_WIDTHS = [
    { wch: 8 },   // Sıra No
    { wch: 25 },  // Süreç/Pozisyon/Departman
    { wch: 15 },  // Risk Grubu
    { wch: 20 },  // Tehlike Faktör
    { wch: 20 },  // Tehlike Kaynağı
    { wch: 20 },  // Tehlike/Risk
    { wch: 20 },  // Risk (Etkisi)
    { wch: 25 },  // İlgili Mevzuat
    { wch: 30 },  // Mevcut Durum
    { wch: 5 },   // O1
    { wch: 5 },   // F1
    { wch: 5 },   // Ş1
    { wch: 10 },  // Risk Skoru1
    { wch: 35 },  // Alınan Önlem
    { wch: 5 },   // O2
    { wch: 5 },   // F2
    { wch: 5 },   // Ş2
    { wch: 10 },  // Risk Skoru2
    { wch: 15 },  // DÖF
    { wch: 15 },  // Sorumlu
    { wch: 12 },  // Termin Tarihi
    { wch: 10 }   // Durum
];

/** Risk skoru → arka plan rengi */
function riskColor(score) {
    if (score <= 20) return '22C55E';
    if (score <= 70) return 'EAB308';
    if (score <= 200) return 'F97316';
    if (score <= 400) return 'EF4444';
    return '7C2D12';
}

// ── DÖF Numara Üreteci ──

/**
 * Otomatik DÖF numarası üretir: DÖF-YYYY-XXXX
 * Sayaç localStorage'da tutulur.
 */
export function generateDOFNumber() {
    const year = new Date().getFullYear();
    const key = `dof_counter_${year}`;
    const counter = (parseInt(localStorage.getItem(key)) || 0) + 1;
    localStorage.setItem(key, counter.toString());
    return `DÖF-${year}-${counter.toString().padStart(4, '0')}`;
}

// ── Yardımcılar ──

/** Tarih formatlayıcı (GG.AA.YYYY) */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR');
}

/**
 * Hücreye stil uygular (XLSX cell nesnesinin s özelliği)
 * NOT: Tam stil desteği için xlsx-style addon gereklidir.
 * Standart SheetJS Community Edition stili desteklemeyebilir.
 */
function applyStyle(ws, cellRef, style) {
    if (!ws[cellRef]) return;
    ws[cellRef].s = style;
}

/** Merge aralığı ekler */
function addMerge(merges, r1, c1, r2, c2) {
    merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

// ── Ana Export Fonksiyonu ──

/**
 * Risk değerlendirme verilerini Excel dosyasına aktarır
 * @param {Object} assessmentData - { workplace, risks, compliance }
 */
export async function exportToExcel(assessmentData) {
    const { workplace = {}, risks = [], compliance = [] } = assessmentData;
    const merges = [];
    const rows = [];

    // ── Satır 1: Başlık bilgileri ──
    rows.push([
        'İşveren', workplace.isverenAdi || '', '',
        'Sorgu/Birim/Proje', workplace.sorguBirimProje || '', '',
        'Doküman No', workplace.dokumanNo || '',
        'Revizyon Tarihi', formatDate(workplace.revTarihi),
        'Yenileme Tarihi', formatDate(workplace.yenilemeTarihi),
        ...new Array(13).fill('')
    ]);
    // İşveren değeri merge: B1:C1
    addMerge(merges, 0, 1, 0, 2);
    // Sorgu/Birim merge: E1:F1
    addMerge(merges, 0, 4, 0, 5);

    // ── Satır 2: Ad, Rev No, Oluşturma Tarihi, Metot ──
    rows.push([
        'Ad', workplace.ad || '', '', '', '',
        '', 'Rev No', workplace.revNo || '',
        'Oluşturma Tarihi', formatDate(workplace.olusturmaTarihi),
        'Metot', 'FINE-KINNEY',
        ...new Array(10).fill('')
    ]);
    // Ad değeri merge: B2:F2
    addMerge(merges, 1, 1, 1, 5);

    // ── Satır 3-4: Boş ayırıcı ──
    rows.push(new Array(22).fill(''));
    rows.push(new Array(22).fill(''));

    // ── Satır 5: Sütun başlıkları ──
    const colHeaders = [
        'Sıra No', 'Faaliyet/Bölüm', 'Risk Grubu', 'Tehlike Faktör', 'Tehlike Kaynağı', 'Tehlike/Risk', 'Risk', 'İlgili Mevzuat',
        'Mevcut Durum', 'O₁', 'F₁', 'Ş₁', 'Risk Skoru₁',
        'Alınan Önlem', 'O₂', 'F₂', 'Ş₂', 'Risk Skoru₂',
        'DÖF', 'Sorumlu', 'Termin', 'Durum'
    ];
    rows.push(colHeaders);

    // ── Satır 6+: Veri satırları ──
    for (const risk of risks) {
        rows.push([
            risk.siraNo || '',
            risk.surecPozisyonDepartman || '',
            risk.riskGrubu || '',
            risk.tehlikeFaktor || '',
            risk.tehlikeKaynagi || '',
            risk.tehlikeRisk || risk.tehlike || '',
            risk.risk || risk.tehlikeRiskEtkisi || '',
            risk.ilgiliMevzuat || '',
            risk.mevcutDurum || '',
            risk.olasilik ?? '',
            risk.frekans ?? '',
            risk.siddet ?? '',
            risk.riskSkoru ?? '',
            risk.alinanOnlem || risk.tavsiyeEdilenOnlemler || '',
            risk.onlemSonrasiO ?? '',
            risk.onlemSonrasiF ?? '',
            risk.onlemSonrasiS ?? '',
            risk.onlemSonrasiRiskSkoru ?? '',
            risk.dof || '',
            risk.sorumlu || '',
            risk.terminTarihi ? formatDate(risk.terminTarihi) : '',
            risk.durum || ''
        ]);
    }

    // ── 2 boş satır ──
    rows.push(new Array(22).fill(''));
    rows.push(new Array(22).fill(''));

    // ── Bakım Çalışmaları İstatistiği ──
    const bakimHeaderRow = rows.length;
    rows.push(['BAKIM ÇALIŞMALARI İSTATİSTİĞİ ÇALIŞMADAĞI', ...new Array(21).fill('')]);
    addMerge(merges, bakimHeaderRow, 0, bakimHeaderRow, 21);

    const kaynaklarRow = rows.length;
    rows.push(['KAYNAKLARIN TEHLİKE LİSTESİ', ...new Array(21).fill('')]);
    addMerge(merges, kaynaklarRow, 0, kaynaklarRow, 21);

    // ── Boş satır ──
    rows.push(new Array(22).fill(''));

    // ── İSG & MSDS Bölümü ──
    const isgHeaderRow = rows.length;
    rows.push(['İSG & MSDS Eğitimleri verilmelidir', ...new Array(21).fill('')]);
    addMerge(merges, isgHeaderRow, 0, isgHeaderRow, 21);

    // Uyum kalemleri
    for (const item of compliance) {
        const durumLabel = item.durum === 'mevcut' ? '✅ Mevcut'
            : item.durum === 'eksik' ? '❌ Eksik'
            : item.durum === 'sonra' ? '⏳ Sonra eklenecek'
            : item.durum || '';
        rows.push([item.label || '', durumLabel, ...new Array(20).fill('')]);
        addMerge(merges, rows.length - 1, 1, rows.length - 1, 3);
    }

    // ── Sheet oluştur ──
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = COL_WIDTHS;
    ws['!merges'] = merges;

    // ── Stil uygula ──
    // NOT: Stiller xlsx-style addon ile çalışır. Standart SheetJS CE'de
    // stiller görmezden gelinebilir ama veri yapısı doğru olacaktır.

    // Satır 1-2 başlık stilleri
    for (let c = 0; c < 22; c++) {
        const ref1 = XLSX.utils.encode_cell({ r: 0, c });
        const ref2 = XLSX.utils.encode_cell({ r: 1, c });
        applyStyle(ws, ref1, STYLE_HEADER);
        applyStyle(ws, ref2, STYLE_HEADER);
    }

    // Satır 5 sütun başlıkları
    for (let c = 0; c < 22; c++) {
        const ref = XLSX.utils.encode_cell({ r: 4, c });
        applyStyle(ws, ref, STYLE_COL_HEADER);
    }

    // Veri satırları stilleri
    for (let i = 0; i < risks.length; i++) {
        const r = 5 + i; // Satır 6'dan itibaren (0-indexed: 5)
        for (let c = 0; c < 22; c++) {
            const ref = XLSX.utils.encode_cell({ r, c });
            // O1, F1, Ş1, Risk Skoru1 (9,10,11,12) ve O2, F2, Ş2, Risk Skoru2 (14,15,16,17) sütunları ortalı
            if ((c >= 9 && c <= 12) || (c >= 14 && c <= 17)) {
                applyStyle(ws, ref, STYLE_DATA_CENTER);
            } else {
                applyStyle(ws, ref, STYLE_DATA);
            }
        }

        // Risk skoru1 hücresine renk
        const score1Ref = XLSX.utils.encode_cell({ r, c: 12 });
        if (ws[score1Ref] && risks[i].riskSkoru != null) {
            const color = riskColor(risks[i].riskSkoru);
            ws[score1Ref].s = {
                ...STYLE_DATA_CENTER,
                fill: { fgColor: { rgb: color } },
                font: { ...STYLE_DATA_CENTER.font, bold: true, color: { rgb: 'FFFFFF' } }
            };
        }

        // Risk skoru2 hücresine renk
        const score2Ref = XLSX.utils.encode_cell({ r, c: 17 });
        if (ws[score2Ref] && risks[i].onlemSonrasiRiskSkoru != null) {
            const color = riskColor(risks[i].onlemSonrasiRiskSkoru);
            ws[score2Ref].s = {
                ...STYLE_DATA_CENTER,
                fill: { fgColor: { rgb: color } },
                font: { ...STYLE_DATA_CENTER.font, bold: true, color: { rgb: 'FFFFFF' } }
            };
        }
    }

    // Bakım ve İSG başlık stilleri
    for (const row of [bakimHeaderRow, kaynaklarRow, isgHeaderRow]) {
        const ref = XLSX.utils.encode_cell({ r: row, c: 0 });
        applyStyle(ws, ref, STYLE_HEADER);
    }

    // ── Workbook oluştur ve indir ──
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Risk Değerlendirme');

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const adSlug = (workplace.ad || 'Rapor').replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, '_');
    const fileName = `Risk_Degerlendirme_${adSlug}_${date}.xlsx`;

    XLSX.writeFile(wb, fileName);
}
