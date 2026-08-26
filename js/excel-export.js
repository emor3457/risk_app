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

/** Sütun genişlikleri — riskcikti.pdf sütun sırası */
const COL_WIDTHS = [
    { wch: 8 },   // Sıra No
    { wch: 25 },  // Faaliyet/Bölüm
    { wch: 30 },  // Tehlike Tanımı
    { wch: 25 },  // Tehlike Kaynağı
    { wch: 15 },  // Etkilenenler
    { wch: 25 },  // Risk
    { wch: 30 },  // İlgili Mevzuat
    { wch: 35 },  // Mevcut Durum
    { wch: 5 },   // O1
    { wch: 5 },   // F1
    { wch: 5 },   // Ş1
    { wch: 10 },  // Risk Puanı (Mevcut)
    { wch: 40 },  // İlave Aksiyon
    { wch: 5 },   // O2
    { wch: 5 },   // F2
    { wch: 5 },   // Ş2
    { wch: 10 },  // Risk Puanı (Önlem Sonrası)
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

    // ── Satır 5: Sütun başlıkları — riskcikti.pdf formatı ──
    const colHeaders = [
        'Sıra No', 'Faaliyet/Bölüm',
        'Tehlike Tanımı', 'Tehlike Kaynağı', 'Etkilenenler', 'Risk', 'İlgili Mevzuat',
        'Mevcut Durum', 'O₁', 'F₁', 'Ş₁', 'Risk Puanı (Mevcut)',
        'İlave Aksiyon', 'O₂', 'F₂', 'Ş₂', 'Risk Puanı (Önlem Sonrası)',
        'DÖF', 'Sorumlu', 'Termin', 'Durum'
    ];
    rows.push(colHeaders);

    // ── Satır 6+: Veri satırları — riskcikti.pdf sütun sırası ──
    for (const risk of risks) {
        const riskPuani = (risk.olasilik ?? 0) * (risk.frekans ?? 0) * (risk.siddet ?? 0);
        const onlemSonrasiPuan = (risk.onlemSonrasiOlasilik ?? 0) * (risk.onlemSonrasiFrekans ?? 0) * (risk.onlemSonrasiSiddet ?? 0);
        rows.push([
            risk.siraNo || '',
            risk.surecPozisyonDepartman || '',
            // Yeni riskcikti sütunları:
            risk.tehlikeTanimi || '',
            risk.tehlikeKaynagi || '',
            risk.etkilenenler || '',
            risk.risk || '',
            risk.ilgiliMevzuat || '',
            risk.mevcutDurum || '',
            risk.olasilik ?? '',
            risk.frekans ?? '',
            risk.siddet ?? '',
            riskPuani || risk.riskSkoru || '',
            risk.ilaveAksiyon || risk.alinanOnlem || '',
            risk.onlemSonrasiOlasilik ?? '',
            risk.onlemSonrasiFrekans ?? '',
            risk.onlemSonrasiSiddet ?? '',
            onlemSonrasiPuan || risk.onlemSonrasiRiskSkoru || '',
            risk.dof || '',
            risk.sorumlu || '',
            risk.terminTarihi ? formatDate(risk.terminTarihi) : '',
            risk.durum || ''
        ]);
    }

    // ── 2 boş satır ──
    rows.push(new Array(21).fill(''));
    rows.push(new Array(21).fill(''));

    // ── Bakım Çalışmaları İstatistiği ──
    const bakimHeaderRow = rows.length;
    rows.push(['BAKIM ÇALIŞMALARI İSTATİSTİĞİ', ...new Array(20).fill('')]);
    addMerge(merges, bakimHeaderRow, 0, bakimHeaderRow, 19);

    const kaynaklarRow = rows.length;
    rows.push(['KAYNAKLARIN TEHLİKE LİSTESİ', ...new Array(20).fill('')]);
    addMerge(merges, kaynaklarRow, 0, kaynaklarRow, 19);

    // ── Boş satır ──
    rows.push(new Array(21).fill(''));

    // ── İSG & MSDS Bölümü ──
    const isgHeaderRow = rows.length;
    rows.push(['İSG & MSDS Eğitimleri verilmelidir', ...new Array(20).fill('')]);
    addMerge(merges, isgHeaderRow, 0, isgHeaderRow, 19);

    // Uyum kalemleri
    for (const item of compliance) {
        const durumLabel = item.durum === 'mevcut' ? '✅ Mevcut'
            : item.durum === 'eksik' ? '❌ Eksik'
            : item.durum === 'sonra' ? '⏳ Sonra eklenecek'
            : item.durum || '';
        rows.push([item.label || '', durumLabel, ...new Array(18).fill('')]);
        addMerge(merges, rows.length - 1, 1, rows.length - 1, 3);
    }

    // ── Sheet oluştur ──
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = COL_WIDTHS;
    ws['!merges'] = merges;
    const TOTAL_COLS = 21;

    // ── Stil uygula ──
    // NOT: Stiller xlsx-style addon ile çalışır. Standart SheetJS CE'de
    // stiller görmezden gelinebilir ama veri yapısı doğru olacaktır.

    // Satır 1-2 başlık stilleri
    for (let c = 0; c < TOTAL_COLS; c++) {
        const ref1 = XLSX.utils.encode_cell({ r: 0, c });
        const ref2 = XLSX.utils.encode_cell({ r: 1, c });
        applyStyle(ws, ref1, STYLE_HEADER);
        applyStyle(ws, ref2, STYLE_HEADER);
    }

    // Satır 5 sütun başlıkları
    for (let c = 0; c < TOTAL_COLS; c++) {
        const ref = XLSX.utils.encode_cell({ r: 4, c });
        applyStyle(ws, ref, STYLE_COL_HEADER);
    }

    // Veri satırları stilleri
    for (let i = 0; i < risks.length; i++) {
        const r = 5 + i; // Satır 6'dan itibaren (0-indexed: 5)
        for (let c = 0; c < TOTAL_COLS; c++) {
            const ref = XLSX.utils.encode_cell({ r, c });
            // riskcikti sütun sırası: O1(7) F1(8) Ş1(9) Puan1(10) ve O2(12) F2(13) Ş2(14) Puan2(15) ortalı
            if ((c >= 8 && c <= 11) || (c >= 13 && c <= 16)) {
                applyStyle(ws, ref, STYLE_DATA_CENTER);
            } else {
                applyStyle(ws, ref, STYLE_DATA);
            }
        }

        // Risk Puanı (Mevcut) hücresine renk — sütun 10
        const rp = (risks[i].olasilik ?? 0) * (risks[i].frekans ?? 0) * (risks[i].siddet ?? 0);
        const score1Ref = XLSX.utils.encode_cell({ r, c: 11 });
        if (ws[score1Ref] && rp > 0) {
            const color = riskColor(rp);
            ws[score1Ref].s = {
                ...STYLE_DATA_CENTER,
                fill: { fgColor: { rgb: color } },
                font: { ...STYLE_DATA_CENTER.font, bold: true, color: { rgb: 'FFFFFF' } }
            };
        }

        // Risk Puanı (Önlem Sonrası) hücresine renk — sütun 15
        const rp2 = (risks[i].onlemSonrasiOlasilik ?? 0) * (risks[i].onlemSonrasiFrekans ?? 0) * (risks[i].onlemSonrasiSiddet ?? 0);
        const score2Ref = XLSX.utils.encode_cell({ r, c: 16 });
        if (ws[score2Ref] && rp2 > 0) {
            const color = riskColor(rp2);
            ws[score2Ref].s = {
                ...STYLE_DATA_CENTER,
                fill: { fgColor: { rgb: color } },
                font: { ...STYLE_DATA_CENTER.font, bold: true, color: { rgb: 'FFFFFF' } }
            };
        }
    }

    // Bakım ve İSG başlık stilleri
    for (const row of [bakimHeaderRow, kaynaklarRow, isgHeaderRow]) {
        for (let c = 0; c < TOTAL_COLS; c++) {
            const ref = XLSX.utils.encode_cell({ r: row, c });
            applyStyle(ws, ref, STYLE_HEADER);
        }
    }

    // ── Workbook oluştur ve indir ──
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Risk Değerlendirme');

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const adSlug = (workplace.ad || 'Rapor').replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, '_');
    const fileName = `Risk_Degerlendirme_${adSlug}_${date}.xlsx`;

    XLSX.writeFile(wb, fileName);
}

/**
 * TÜM değerlendirmeleri tek bir Excel dosyasına aktarır (her biri ayrı sayfa)
 * @param {Array<{workplace, risks, assessmentDate}>} allData
 */
export async function exportAllToExcel(allData) {
    const wb = XLSX.utils.book_new();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Özet sayfası
    const summaryRows = [
        ['TÜM RİSK DEĞERLENDİRMELERİ KONSOLDE RAPORU', '', '', '', '', '', ''],
        ['Rapor Tarihi:', new Date().toLocaleDateString('tr-TR'), '', '', '', '', ''],
        [''],
        ['Sıra', 'İşyeri / İşveren', 'Değerlendirme Tarihi', 'Toplam Risk', 'Yüksek Risk (Sev.1-2)', 'Orta Risk (Sev.3)', 'Kabul Edil. (Sev.4-5)']
    ];

    for (let i = 0; i < allData.length; i++) {
        const { workplace = {}, risks = [], assessmentDate } = allData[i];
        const high   = risks.filter(r => { const s = (r.olasilik||0)*(r.frekans||0)*(r.siddet||0); return s >= 200; }).length;
        const mid    = risks.filter(r => { const s = (r.olasilik||0)*(r.frekans||0)*(r.siddet||0); return s >= 70 && s < 200; }).length;
        const low    = risks.filter(r => { const s = (r.olasilik||0)*(r.frekans||0)*(r.siddet||0); return s < 70; }).length;
        summaryRows.push([
            i + 1,
            workplace.isverenAdi || workplace.ad || 'Bilinmiyor',
            assessmentDate ? new Date(assessmentDate).toLocaleDateString('tr-TR') : '',
            risks.length, high, mid, low
        ]);
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 20 }];
    // Başlık merge
    if (!wsSummary['!merges']) wsSummary['!merges'] = [];
    wsSummary['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');

    // Her değerlendirme için ayrı sayfa
    for (let i = 0; i < allData.length; i++) {
        const { workplace = {}, risks = [], compliance = [], assessmentDate } = allData[i];
        const merges = [];
        const rows = [];

        rows.push([
            'İşveren', workplace.isverenAdi || '', '',
            'Sorgu/Birim/Proje', workplace.sorguBirimProje || '', '',
            'Doküman No', workplace.dokumanNo || '',
            'Revizyon Tarihi', formatDate(workplace.revTarihi),
            'Yenileme Tarihi', formatDate(workplace.yenilemeTarihi),
            ...new Array(8).fill('')
        ]);
        addMerge(merges, 0, 1, 0, 2);
        addMerge(merges, 0, 4, 0, 5);

        rows.push([
            'Ad', workplace.ad || '', '', '', '',
            '', 'Rev No', workplace.revNo || '',
            'Oluşturma Tarihi', formatDate(workplace.olusturmaTarihi),
            'Metot', 'FINE-KINNEY',
            ...new Array(8).fill('')
        ]);
        addMerge(merges, 1, 1, 1, 5);

        rows.push(new Array(21).fill(''));
        rows.push(new Array(21).fill(''));

        const colHeaders = [
            'Sıra No', 'Faaliyet/Bölüm',
            'Tehlike Tanımı', 'Tehlike Kaynağı', 'Etkilenenler', 'Risk', 'İlgili Mevzuat',
            'Mevcut Durum', 'O₁', 'F₁', 'Ş₁', 'Risk Puanı (Mevcut)',
            'İlave Aksiyon', 'O₂', 'F₂', 'Ş₂', 'Risk Puanı (Önlem Sonrası)',
            'DÖF', 'Sorumlu', 'Termin', 'Durum'
        ];
        rows.push(colHeaders);

        for (const risk of risks) {
            const rp  = (risk.olasilik ?? 0) * (risk.frekans ?? 0) * (risk.siddet ?? 0);
            const rp2 = (risk.onlemSonrasiOlasilik ?? 0) * (risk.onlemSonrasiFrekans ?? 0) * (risk.onlemSonrasiSiddet ?? 0);
            rows.push([
                risk.siraNo || '', risk.surecPozisyonDepartman || '',
                risk.tehlikeTanimi || '', risk.tehlikeKaynagi || '', risk.etkilenenler || '',
                risk.risk || '', risk.ilgiliMevzuat || '',
                risk.mevcutDurum || '',
                risk.olasilik ?? '', risk.frekans ?? '', risk.siddet ?? '',
                rp || risk.riskSkoru || '',
                risk.ilaveAksiyon || risk.alinanOnlem || '',
                risk.onlemSonrasiOlasilik ?? '', risk.onlemSonrasiFrekans ?? '', risk.onlemSonrasiSiddet ?? '',
                rp2 || risk.onlemSonrasiRiskSkoru || '',
                risk.dof || '', risk.sorumlu || '',
                risk.terminTarihi ? formatDate(risk.terminTarihi) : '',
                risk.durum || ''
            ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = COL_WIDTHS;
        ws['!merges'] = merges;

        // Risk puanı renklendirmesi
        for (let j = 0; j < risks.length; j++) {
            const r = 5 + j;
            const rp = (risks[j].olasilik ?? 0) * (risks[j].frekans ?? 0) * (risks[j].siddet ?? 0);
            if (rp > 0) {
                const ref = XLSX.utils.encode_cell({ r, c: 11 });
                if (ws[ref]) ws[ref].s = { ...STYLE_DATA_CENTER, fill: { fgColor: { rgb: riskColor(rp) } }, font: { bold: true, color: { rgb: 'FFFFFF' } } };
            }
            const rp2 = (risks[j].onlemSonrasiOlasilik ?? 0) * (risks[j].onlemSonrasiFrekans ?? 0) * (risks[j].onlemSonrasiSiddet ?? 0);
            if (rp2 > 0) {
                const ref2 = XLSX.utils.encode_cell({ r, c: 16 });
                if (ws[ref2]) ws[ref2].s = { ...STYLE_DATA_CENTER, fill: { fgColor: { rgb: riskColor(rp2) } }, font: { bold: true, color: { rgb: 'FFFFFF' } } };
            }
        }

        // Sayfa ismi: "1-IsyeriAdi" (max 31 karakter Excel limiti)
        const sheetName = `${i + 1}-${(workplace.isverenAdi || workplace.ad || 'Rapor').replace(/[\\\/*?\[\]:]/g, '').slice(0, 25)}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    XLSX.writeFile(wb, `Risk_Tum_Degerlendirmeler_${date}.xlsx`);
}
