# Risk Değerlendirme Analizi (v4)

Bu uygulama, Türkiye 6331 sayılı İş Sağlığı ve Güvenliği (İSG) Kanunu'na uygun olarak "Fine-Kinney" metoduyla risk değerlendirmesi yapmanızı sağlayan yapay zeka destekli bir Progressive Web App (PWA) çözümüdür.

## Özellikler

*   **Çift Aşamalı Puanlama:** Mevcut durum ve alınan önlemler sonrasındaki durum için çift O-F-Ş skoru hesabı.
*   **Yapay Zeka Entegrasyonu:** Fotoğraf, video veya metin üzerinden tehlikeleri tespit eder, ilgili yasal mevzuatı bulur ve çözüm önerileri sunar (Gemini API).
*   **22 Sütunluk Kurumsal Excel Çıktısı:** Değerlendirmelerinizi şirketin resmi "IST Risk Değerlendirme Planı" şablonunda doğrudan Excel (.xlsx) olarak verir.
*   **Tam PWA ve Çevrimdışı Destek:** Telefonunuzdan galeri ve kamera erişimiyle, internetin kısıtlı olduğu sahalarda bile hızlı veri girişi sağlar. Veriler yerel tarayıcınızda (IndexedDB) tutulur.

## Klasör Yapısı

*   `index.html`, `css/`, `js/`: Uygulamanın frontend (kullanıcı arayüzü) dosyaları.
*   `sw.js`, `manifest.json`: PWA kurulum ve çevrimdışı önbellekleme dosyaları.
*   `Dockerfile`, `docker-compose.yml`: Sunucu (VPS) üzerinde kolayca yayınlanması için kullanılan imaj dosyaları.
*   `lib/`: Offline çalışabilmesi için dahil edilmiş kütüphaneler (örn. SheetJS).

---

## 🚀 Sunucuya Hızlı Dağıtım (Deploy) Rehberi

Bu proje artık manuel **zip dosyası kopyalama derdi olmadan** doğrudan Git/GitHub üzerinden Google Cloud VPS'inize aktarılacak şekilde ayarlanmıştır. İleride uygulamada herhangi bir kod değişikliği veya yeni bir versiyon (v5, v6 vs.) yaptığınızda aşağıdaki **2 kolay adımı** takip edeceksiniz.

### ADIM 1: Kendi Bilgisayarınızdan GitHub'a Gönderme
Kodlarda (HTML, JS, CSS vb.) değişikliğinizi tamamladıktan sonra bilgisayarınızdaki (Masaüstündeki) terminalde sırasıyla şunları çalıştırın:

```bash
git add .
git commit -m "feat: [yaptiginiz-degisiklik-ozeti]"
git push origin master
```

### ADIM 2: VPS (Sunucu) Üzerinde Güncelleme
Google Cloud SSH terminalinize bağlanın ve projenizin olduğu klasöre girin:

```bash
cd /home/emrahunal57/risk_app
```

Yeni kodları GitHub'dan çekin:
```bash
git pull origin master
```

Docker konteynerini eski haliyle durdurun ve **yeni kodlarla (--build parametresi ile) baştan ayağa kaldırın:**
```bash
sudo docker-compose down
sudo docker-compose up -d --build
```

**İşlem Tamam!** Tüm yeni kodlar canlı yayına girmiş olacaktır. Tarayıcınızda gizli sekmeyle veya önbelleği temizleyerek (CTRL+F5) test edebilirsiniz.
