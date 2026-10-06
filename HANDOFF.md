# Raund 4 — görsel revizyon 4, görsel kabul açık

Repo: https://github.com/deus-ex-machina-18/Kalori-Takip
Dal: r4-visual-quality · taslak PR #1 · 6 Ekim 2026
Başlangıç: 6ce39d249ee228841671a3d0634948d05b44766b. Main birleştirilmedi; yayın ve R5 bu turda yapılmadı.

## Sonuç ve görsel sınır

Gri-beyaz yön korunarak kedi yeniden şekillendirildi. Göz yuvaları, iris yüzeyi, kulak hacmi, ağız ve parmaklar; yoğun kısa kürk, ışık ve halı geliştirildi. Gerçek canlı sahnenin büyük görüntüsü `docs/verification/r4-live-render.png`; uygulamanın statik yedeği aynı görüntünün WebP kodlaması `public/models/cat-poster.webp`.

**Referanstaki doğal kürk ve sinematik oda ışığı birebir karşılandı denmez. Kullanıcının görsel kabulü açık.** Yeni yön seçilmedi; tekrar üç örnek seçimi gerekmedi. Yalnız teknik testlerin geçmesi görsel hedefin tamamlandığı anlamına gelmez.

## Uygulanan değişiklik

- Başta kapalı SDF göz yuvaları; küre yerine korneal kapak, daha sakin kahverengi iris, büyük pupil ve az sayıda yansıma. Muzzle hacmi, burun/ağız ve kaş yerleşimi değişti.
- Kulaklar düz ekstrüzyon yerine düzgün normalli, kapalı, çanak biçimli yüzeyler; pembe iç yüzeyi hacme oturur. Ön patilerde yuvarlak parmak hacimleri, dolgun kuyruk.
- Baş/göz/kulak/ağız kemik pivotları yeni yüzle hizalandı; altı klip korundu.
- GLB'deki kısa tüylerin yanında 12 rigli underfur katmanı. Aynı kaplama vertex buffer'ları ve iskelet kullanılır; ayrı indirilen bir kürk modeli yok. Folikül maskesi komşu hücrelerde düzensiz köklerden ve her tüy için sabit bükülmeden oluşur; tekrarlanan diyagonal desen azaltıldı. Shader tek baskın yüzey projeksiyonu kullanır.
- Kaplama ve katmanlar ışık/gölge alır; PCF soft shadow, sıcak ana ışık, daha düşük doldurma, temas gölgesi, yuvarlak ve dokulu halı. Gözlerin aşırı ortam yansıması azaltıldı.
- Hafif mod DPR 1, gölgesiz, 4 underfur katmanı ve yarım kısa tüy kullanır; sonraki düşük FPS örneği statik yedeğe geçer. Eşik/süre değiştirilmedi. Görünmezken durma, care önceliği, döndürme ve tercih kaydı korunur.
- Statik yedek 600 CSS px aynı canlı sahneden üretilir; yüksek çözünürlüklü WebP yaklaşık 74 KB. İlk yükleme bütçesine poster de katıldı. Eski PNG yedeği kaldırıldı; büyük PNG yalnız doğrulama belgesidir.

Kalori/aktivite/plan/haftalık motorlar, IndexedDB şeması ve beş ekran değişmedi. Dış model satın alınmadı; yeni ücretli servis kullanılmadı.

## Bütçe ve doğrulama

Boyut, hash, üçgen/kemik/klip ve poster envanterinin kaynağı `public/models/asset-manifest.json` (sürüm 4). Render ayarlarının kaynağı `assets/cat/render-settings.json`.

- GLB: 48.380 üçgen (25.880 temel + 22.500 kısa tüy), 14 kemik, 6 klip. GLB + albedo + aktif WebP poster yaklaşık 4,52 MB; ≤5 MiB kontrolü geçer. GLB validator sıfır hata/uyarı; beyaz kaplamanın kapalı yüzey testi ve hash kontrolleri geçti.
- Katmanlar nedeniyle **çalışma anındaki bütçe arttı**: gölge geçişi dahil tam sahne 281.366 çizilen üçgen / 42 draw call; manifest sınırı 300.000. GLB'nin ≤50 bin bütçesi ile GPU'nun tekrar çizdiği katmanlar ayrı sayılardır. Bu artış fiziksel Android performans kabulü değildir.
- TypeScript/üretim build'i, 36 domain/depo + 20 DOM testi geçti. Güncel gerçek Chromium kabulü `docs/verification/r4-browser-report.json`, errors=[].
- 320/360/390/768/1280px: beş ekran, yerel profil/kalori/aktivite/kilo ve native IndexedDB; kayıt başarısızlığında retry, klavye/odak, taşma ve kontrol erişimi geçti.
- Gerçek model/shader render'ı, döndürme/sürükleme/reset, model ve albedo 404, WebGL yokluğu ve context kaybında kalori formunun korunması geçti. Statik mod ve hareket tercihi kalıcı.
- 160px software backbuffer'da kısa play/stretch/sleep ve görünmezken durma/devam kontrolleri ayrı yeni sahnelerle yapılır. Uzun software-GPU döngüsü düşük FPS yedeğine geçebilir; bu kontrol sürekli animasyon FPS kabulü değildir. Tam boy yavaş RAF ile 12→4 katman→statik akış ayrıca doğrulandı.
- Yerel software Chromium yükleme 1,5–2,1 sn olan son iki koşu ayrı JSON raporlarında. Bunlar internet, fiziksel Android veya Android'de ≥30 FPS/<3 sn kabulü değildir.

Önceki sürümün CI sonucu bu sürümün CI kanıtı sayılmaz; dalın son commit'i için ayrıca kontrol edilir.

## Tekrar üretim

```bash
npm ci
npm run assets:cat
npm run build
node scripts/render-cat-poster.mjs
npm run check
node scripts/browser-check.mjs
```

Poster render'ı manifest'in poster hash/ilk yükleme toplamını yeniler; ardından build son posteri dist'e taşır. Model veya sahne değişirse poster yenilenir. Farklı Chromium binary için `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` desteklenir. Büyük PNG doğrulama görüntüsü, 390px gerçek uygulama ve JSON raporları `docs/verification/` içinde.

## Sonraki tek görev

R4'ün bu gerçek render'ını referans ve kullanıcı geri bildirimiyle değerlendirmek; kalan doğal kürk/ışık farkına odaklanmak. Fiziksel Android'de 12/4 katman ve statik moda geçişi ölçmek. R5'e geçilmez; görsel kabul açık. Yeni model veya yön seçilecekse üç örnek şartı sürer.
