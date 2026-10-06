# Raund 4 — görsel revizyon 3, kabul açık

Repo: https://github.com/deus-ex-machina-18/Kalori-Takip
Dal: r4-visual-quality · 6 Ekim 2026 · mevcut taslak PR #1
Başlangıç checkpoint: f619af1778c4869a18d243ec6430f956daf77ef1. Main eski R4 sürümündedir; bu değişiklikler görsel revizyon dalındadır. Yayın yapılmadı, R5'e geçilmedi.

## Güncel durum

ZIP paketi güncel dal ile karşılaştırıldı ve aynı kaynakları içerdiği doğrulandı. Bu turda model oranları, göz yüzeyi ve kürk ışıklanması geliştirildi; SDF kesilmelerinden gelen pati/ağız açıklıkları giderildi. Gerçek uygulama render'ı `public/models/cat-poster.png` içinde. **Referanstaki yoğun ve doğal kürk kalitesine tam ulaşıldığı iddia edilmez. Kullanıcının görsel kabulü hâlâ açık.**

## Değişiklikler

- Gövde, arka bacak ve patiler dolgunlaştırıldı; kafa/rig birlikte aşağı alındı. İris ve pupil tek yüzeyde, göz çevresindeki kalın halka kaldırıldı; burun/ağız/bıyık konumu güncellendi.
- MarchingCubes kenar hücrelerini atladığı için yüzey örnekleme alanı genişletildi. Önceki geometrinin ön pati, yan yüzey ve ağız açıklıkları kapandı. `test:assets` artık exported FurWhite kaplamanın açık kenarı olmadığını da doğrular; format validator'ı tek başına bu kusuru bulmuyordu.
- Kısa tüyler fiziksel sahne ışıklarını kullanır; iki yüzde dışa bakan kaplama normali korunur. Ters normalden gelen benekler kaldırıldı. Albedo ve bump aynı kürk kaynağından; kontrolsüz beyazlama önlendi. Sıcak ışık/doldurma, VSM zemin gölgesi, temas gölgesi ve oda yüzeyi örneklemesi ayarlandı.
- Aynı gerçek GLB render'ı statik yedeğe kaydedildi. Üretilmiş konsept resmi 3D model diye kullanılmadı; yeni ücretli veya stock asset yok.
- Kalori/aktivite/plan/haftalık motorlar, IndexedDB şeması, kayıt formu ve beş ekran değişmedi. Mevcut care önceliği, altı animasyon, tercih saklama, low-FPS balanced→statik ve hata yedeği korunur.

Boyut/hash/üçgen/kemik/klip sayılarının tek kaynağı `public/models/asset-manifest.json` (sürüm 3); kaynak ve lisanslar aynı dizin yapısında. Model+albedo ilk yüklemesi bütçe içinde, önceki revizyondan daha küçüktür.

## Doğrulama

- TypeScript, üretim build'i, 36 domain/depo + 20 DOM testi geçti. GLB validator sıfır hata/uyarı; hash, ≤5 MiB, geometri bütçesi, rig/klip ve kapalı kaplama kontrolü başarılı.
- Tamamlanmış gerçek Chromium raporu `docs/verification/r4-browser-report.json`: errors=[]; 320/360/390/768/1280px beş ekran, klavye/odak, native IndexedDB R2/R3, tam boy WebGL görünümü ve döndürme/sürükleme/reset geçti.
- play/stretch/sleep ve görünmezken durma/dönüş mekanikleri 160px software backbuffer'da geçti. Tam boy yavaş RAF balanced→statik; model/albedo 404, WebGL yokluğu ve context-loss kayıt formunu korudu.
- `r4-browser-metrics.json` ve `r4-render-metrics.json` farklı yerel Software Chromium koşularını içerir. Bunlar fiziksel Android veya internet performansı kabulü değildir. Yerel ilk yükleme 2.1–6.3 sn arasında değişti; <3 sn hedefi sağlandı diye genellenmez.
- Terminal push kimliği yoktu; kod/varlıklar GitHub bağlantısıyla aynı dalın ileri güncellemesi olarak kaydedildi. Ana dal birleştirilmedi. Bu sürümün GitHub CI sonucu PR'dan ayrıca izlenmelidir; önceki dal koşusu yeni commit'in CI kanıtı değildir.

## Çalıştırma

```bash
npm ci
npm run check
npm run dev
```

Model/material tekrar üretimi `npm run assets:cat`. Build sonrası gerçek render `node scripts/render-cat-poster.mjs`; tam tarayıcı kabulü `node scripts/browser-check.mjs`. Playwright Chromium gerekir; farklı binary için `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` desteklenir. Model veya sahne değişirse poster yenilenir.

## Sonraki tek iş

Gri-beyaz seçilen yönün gerçek render'ını kullanıcıyla değerlendirmek; referans farkını kapatacak sonraki görsel işi bunun üzerinden sınırlamak. R5 eklenmez. Yeni bir görsel/3D yön seçilecekse üç örnek şartı sürer; mevcut yön için yeniden seçim gerekmez.

Fiziksel Android performansı, ekran okuyucu, gerçek zoom ve pilot incelemeleri açık. Login/senkronizasyon/yedekleme/hosting/offline/push bu turda kurulmadı.
