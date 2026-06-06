# Risk Değerlendirme Analizi - Proje Bağlam Dosyası

## Proje Bilgisi
- **Proje Adı**: Risk Değerlendirme Analizi Uygulaması
- **Konum**: `c:\Users\User\Desktop\Programlama\risk_degerlendirme_analizi`
- **Başlangıç Tarihi**: 2026-05-27
- **Teknoloji**: HTML + CSS + JavaScript (Vanilla Web App)
- **Durum**: Planlama aşamasında
- **Çıktı Formatı**: Excel (.xlsx) — SheetJS kütüphanesi
- **Mobil**: PWA (Progressive Web App) — Android telefondan kullanılabilir
- **AI**: Gemini API (2.5 Flash varsayılan, ücretsiz katman)

## Karpathy Prensipleri (Bu proje boyunca uygulanacak)

### 1. Kodlamadan Önce Düşün
- Varsayımları açıkça belirt. Belirsizse sor.
- Birden fazla yorum varsa hepsini sun, sessizce seçme.
- Daha basit bir yaklaşım varsa söyle.
- Bir şey belirsizse dur, ne olduğunu belirt, sor.

### 2. Sadelik Önce
- İstenenden fazla özellik yok.
- Tek kullanımlık kod için soyutlama yok.
- İstenmeden "esneklik" veya "yapılandırılabilirlik" yok.
- İmkansız senaryolar için hata yönetimi yok.
- 200 satır 50 satır olabiliyorsa, yeniden yaz.

### 3. Cerrahi Değişiklikler
- Sadece gerekeni değiştir.
- İlgisiz kodu, yorumları, biçimlendirmeyi "iyileştirme".
- Bozuk olmayan şeyleri yeniden düzenleme.
- Mevcut stile uy.
- İlgisiz ölü kod fark edersen, sil değil, söyle.

### 4. Hedef Odaklı Yürütme
- Testler önce, doğrulanabilir başarı kriterleri ile.

## Proje Mimarisi

### Temel Özellikler
1. **İşyeri Bilgi Yönetimi**: Adres, sicil no, bölüm, NACE kodu, tehlike sınıfı
2. **AI Analizi**: Gemini API ile fotoğraf/video/ses/metin analizi → otomatik tehlike tespiti
3. **Risk Değerlendirmesi**: Fine-Kinney metodu (R = O × F × Ş) — AI önerir, uzman onaylar
4. **Üç Bazda Değerlendirme**: Proses, Çalışan, Mekan bazlı
5. **Medya Yakalama**: Fotoğraf, video, ses ve metin tabanlı kayıtlar
6. **Yönetmelik Uyumu**: 6331 sayılı kanun gereksinimleri
7. **Hatırlatma Sistemi**: MSDS, kullanma talimatı, acil durum planı vb.
8. **Excel Çıktısı**: Kullanıcının verdiği şablon formatında (.xlsx)
9. **PWA**: Android telefondan kamera, mikrofon, offline kullanım

### Fine-Kinney Parametreleri
- **Olasılık (O)**: 0.1, 0.2, 0.5, 1, 3, 6, 10
- **Frekans (F)**: 0.5, 1, 2, 3, 6, 10
- **Şiddet (Ş)**: 1, 3, 7, 15, 40, 100
- **Risk Skoru**: R = O × F × Ş
- **Seviyeleri**: ≤20 Kabul Edilebilir | 21-70 Dikkate Değer | 71-200 Önemli | 201-400 Yüksek | >400 Çok Yüksek

### Şablon Tablo Sütunları (Kullanıcı Şablonundan)
- Sıra No | Süreç/Pozisyon/Departman | Tehlike/Risk | Tehlike/Risk Etkisi
- Mevcut Durum | O | F | Ş | Risk Skoru | Fotoğraf
- Tavsiye Edilen Önlemler/Aksiyonlar | DÖF | Sorumlu | Termin Tarihi | Durum
- Alt bölüm: Bakım Çalışmaları İstatistiği + İSG & MSDS kontrol listesi

### Klasör Yapısı
```
risk_degerlendirme_analizi/
├── gemini.md                    # Bu dosya - proje bağlam belleği
├── index.html                   # Ana sayfa (SPA)
├── manifest.json                # PWA manifest
├── sw.js                        # Service Worker
├── css/
│   └── index.css                # Ana stil dosyası
├── js/
│   ├── app.js                   # Ana uygulama mantığı + SPA router
│   ├── database.js              # IndexedDB veri yönetimi
│   ├── fine-kinney.js           # Fine-Kinney hesaplama motoru
│   ├── media-handler.js         # Medya (fotoğraf/video/ses) işleme
│   ├── compliance-checker.js    # Yönetmelik uyum kontrolü ve hatırlatmalar
│   ├── excel-export.js          # Excel rapor üreteci (SheetJS)
│   └── ui-components.js         # UI bileşenleri
├── assets/
│   └── icons/                   # PWA ikonları
└── lib/
    └── xlsx.full.min.js         # SheetJS kütüphanesi
```

## Versiyon Geçmişi
- **v0.1** (2026-05-27): Planlama aşaması başladı
- **v0.2** (2026-05-27): Şablon alındı, Excel export + PWA/Android desteği planlandı
- **v0.3** (2026-05-27): Gemini AI entegrasyonu eklendi (otomatik tehlike analizi)

## Notlar & Kararlar
- Tablo çıktı formatı kullanıcı şablonundan alındı (IST Risk Değerlendirme Planı formatı)
- Backend yok, tüm veri IndexedDB'de saklanacak
- Medya dosyaları File API ile yönetilecek (yerel depolama)
- Excel çıktısı SheetJS (xlsx) kütüphanesi ile üretilecek
- PWA olarak Android'de çalışacak (native app değil)
- Kırmızı tema (şablondaki kırmızı başlık rengine uygun)
- DÖF numarası otomatik üretilecek (DÖF-YYYY-XXXX formatı)
- Fotoğraflar Excel'de yer almayacak (sadece uygulama içinde görüntülenecek)
- Video analizi kare kare yapılacak (key frame extraction → Gemini'ye gönder)
