# R4 devir teslim — görsel hedef hâlâ açık

Güncelleme: 6 Ekim 2026. Repo: https://github.com/deus-ex-machina-18/Kalori-Takip

**Dal: `r4-visual-quality`. Taslak [PR #1](https://github.com/deus-ex-machina-18/Kalori-Takip/pull/1). Son uygulama commit'i: `e5e35c3821cf55965743ae8a20cf824785db5d7a`. Bu devir ayrıca doküman commit'iyle kaydedilir; başlamadan PR'nin güncel head'ini kontrol et. Main bu uygulamayı içermiyor. Birleştirme ve yayın yapılmadı.**

## Sonraki tek görev

Mevcut gri-beyaz gerçek 3D kedinin doğal kısa kürkünü ve sıcak oda ışığını hedef referansa yaklaştıran bir görsel revizyon teslim et. Önce mevcut görüntünün en büyük 2–3 farkını belirle; bu farklarla ilgisiz özellik ekleme. Mevcut geometri/rig/kürk bileşenlerini kullan. Temel yaklaşım hedefe yetmiyorsa art arda küçük ayarlar yapmak yerine nedenini belirt ve yeni yönü somut örneklerle değerlendir.

Başlangıçta bu üç görüntüyü gerçekten aç:

- **Hedef:** `docs/verification/r4-target-reference.png` — kullanıcının verdiği turuncu-beyaz kedi. Rengini kopyalama: ince doğal kürk, bebek kedi oranları, sakin göz yansımaları, yumuşak temas gölgesi ve sıcak oda ışığı kalite referansıdır. Uygulamada gri-beyaz korunur. Bu görsel lisanslı bir 3D model veya uygulama render'ı değildir.
- **Mevcut gerçek sahne:** `docs/verification/r4-live-render.png`. Aynı canlı GLB/shader/ışık 600 CSS px sahnede render edildi; bu büyük görüntü mobil performans kanıtı değildir.
- **Gerçek telefon düzeni:** `docs/verification/r4-mobile-390.png`. Kullanıcının göreceği boyutta yüzün ve kürkün okunurluğunu ayrıca değerlendir.

Tek teslim: çalışan güncel kedi, aynı sahneden statik WebP, yeni gerçek uygulama görüntüsü ve gerekli doğrulama; mevcut PR dalına kaydedilir. Teknik kontroller görsel kabulün yerine geçmez. Kullanıcının görsel kabulü açık.

## Kararlar ve sınır

Kullanıcı üç örnek arasından **“1 hocam ama rengi gri-beyaz olsun”** seçimini yaptı. Bu yön içindeki kalite revizyonu için yeniden üç örnek isteme. Model/stil yönünü değiştireceksen önce üç somut örnek göster ve seçim al.

Kedi geometrisi, kürk, materyal, ışık, kamera ve gerekli varlık/doğrulama dosyaları değişebilir. Kalori/aktivite/plan/haftalık hesap motorları, IndexedDB v1 şeması, beş ekran ve Vite + TypeScript DOM mimarisi korunur. R5 ödül/bildirim ve R6 export/silme/hosting ekleme. Kaloriye göre beden boyutu değişmez; düşük tüketimde `care` oyun/kutlamadan önceliklidir. Kalori formu sahneden bağımsız çalışır. Kalıcı kararlar `PROJECT.md`, aktif iş `CURRENT_TASK.md` içindedir.

## Kaydedilen uygulama

- Kapalı SDF göz yuvaları, korneal iris kapağı ve daha sakin kahverengi gözler; burun/ağız, kaş ve bıyık yerleşimi; çanak kulaklar, yuvarlak parmaklar ve dolgun kuyruk.
- Yüzle hizalı pivotlar; 14 kemik, `idle/happy/stretch/play/sleep/care` klipleri.
- GLB'deki 22.500 geometrik kısa tüyün yanında **12 rigli underfur katmanı**. Aynı GLB vertex/skin buffer'ları ve iskelet kullanılır; ayrı kürk indirmesi yok. Düzensiz folikül kökleri ve sabit tüy bükülmesi.
- Sıcak ana ışık, azaltılmış dolgu/ortam yansıması, PCF soft gölge, dokulu yuvarlak halı ve sade duvar ışığı.
- Tam mod DPR≤1.5. İlk 4 sn örneğinde <26 FPS: DPR≤1, gölgesiz, 4 katman, yarım kısa tüy. Sonraki <20 FPS: statik yedek. Görünmez kart/sekmede animasyon durur.
- `public/models/cat-poster.webp` aynı gerçek sahneden üretildi. Eski aktif PNG kaldırıldı; büyük PNG yalnız doğrulama belgesidir.

## Dosya haritası — tek doğruluk kaynakları

| İş | Dosya |
|---|---|
| Gövde/yüz/kulak/parmak/geometrik tüy | `scripts/cat-geometry.mjs` |
| Rig/klip/GLB/manifest üretimi | `scripts/build-cat.mjs` |
| Rigli katman shader'ı ve hafif mod | `src/ui/cat-fur.ts` |
| Kamera/ışık/materyal/oda/FPS/yedek/dispose | `src/ui/cat-scene.ts` |
| Kedi kartı ve statik yedek | `src/ui/cat-card.ts` |
| Katman sayıları ve runtime üçgen sınırı | `assets/cat/render-settings.json` |
| Aktif varlık/hash/boyut/klip envanteri | `public/models/asset-manifest.json` |
| Albedo kaynağı/prompt/JPEG kodlama | `assets/cat/white-fur-source.*`, `scripts/build-cat-texture.mjs` |
| Aynı sahneden WebP ve büyük PNG | `scripts/render-cat-poster.mjs` |
| GLB/topoloji/hash/boyut kontrolü | `scripts/validate-cat.mjs` |
| Gerçek tarayıcı akış/hata yolu kabulü | `scripts/browser-check.mjs` |

Araştırma `docs/CAT_ASSET_RESEARCH.md`, şartname `docs/CAT_ASSET_REQUIREMENTS.md`. İncelenen hazır kediler satın alınmadı/kullanılmadı. Özgün model/rig/shader MIT. Önceki imagegen albedosu yalnız materyal swatch'ıdır. Hazır varlık seçilecekse kürkün web GLB'de çalışmasını ve ham dosyayı depoda dağıtma hakkını doğrula; önizlemeyi varlık diye sunma.

## Doğrulananlar ve açık sorunlar

`e5e35c3` uygulaması için TypeScript/üretim build'i; **36 domain/depo + 20 DOM = 56 test**; GLB validator sıfır hata/uyarı; kapalı beyaz kaplama ve hash/bütçe kontrolleri geçti. `docs/verification/r4-browser-report.json` içinde `errors=[]`, varlık hash'leri ve doğrulama tarihi var. Yeni değişikliğe eski test sonucunu atfetme.

Gerçek Chromium: 320/360/390/768/1280 genişlikte beş ekran, native IndexedDB kayıt/yeniden yükleme/retry, klavye/odak ve taşma; gerçek model/shader, sürükleme/döndürme/reset; model/albedo 404, WebGL yokluğu/context kaybında kalori formu; statik tercih, hareket azaltma ve 12→4→statik geçişi geçti. Kısa animasyonlar **160px software backbuffer'da ayrı yeni sahnelerle** kontrol edildi; tam boy sürekli animasyon performansı kabul edilmedi.

| Ölçüm | Sonuç |
|---|---|
| GLB geometri | 48.380 üçgen: 25.880 temel + 22.500 kısa tüy |
| GLB + albedo + aktif poster | 4.518.156 byte; ≤5 MiB |
| Tam render, gölge dahil | 281.366 çizilen üçgen, 42 draw call; sınır 300.000 |
| Yerel SwiftShader yükleme | Son iki koşu 1.488 / 2.079 ms; Android/internet ölçümü değil |

**Açık:** referansın doğal kürk/ışık kalitesine ulaşılmadı; görünüm hâlâ oyuncak hissi veriyor. Katmanlar GPU yükünü artırdı. Fiziksel Android'de ≥30 FPS ve <3 sn hedefleri ölçülmedi. Bu cihaz kabulü ayrı açık gereksinimdir; software Chromium ile kapatma. Son uygulama commit'i için GitHub CI sonucu ayrıca doğrulanmalı.

## Tekrar yaşanmasın

- Underfur `bindMode` kaynak coat'tan alınır; aynı skeleton/bindMatrix ve parent transform'u korunur. Detached bağlama/world transform'u iki kez uygulama kürkü döndürmede kaydırdı.
- Iris winding/normallerini koru. Aşırı clearcoat/ortam yansıması gözü metal küreye benzetti; validator bunu yakalamaz.
- PCF bilinçli seçildi; VSM'de kürk receiver'ları ilave gölge çizimine girip yükü artırdı. Değişiklikten sonra gerçek render sayısını ölç.
- SwiftShader uzun animasyonda statik moda geçebilir. FPS eşiklerini gevşeterek testi geçirme; kısa mekanik ve uzun yedek geçiş testlerini ayrı tut.
- GLB üçgen sayısı runtime katman/gölge sayısı değildir. Yalnız GLB ≤50 bin diye GPU yükünün düşük olduğunu söyleme.
- Sahne/model değişince poster ve hash'leri yenile. Üretilmiş hedef resmi gerçek uygulama render'ı diye sunma.

## Çalıştırma ve kabul

Node ≥22.12 (CI 24), npm. Önce mevcut varlıkları değiştirmeden `npm ci` ve `npm run check` ile temel durumu doğrula. Render için Playwright Chromium gerekir: kurulu binary yoksa `npx playwright install chromium`; farklı binary için `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Eski sohbetin scratch yoluna veya node_modules symlink'ine bağımlı kalma.

Geometri/rig/albedo değiştiyse `npm run assets:cat`; yalnız sahne/shader değiştiyse mevcut GLB'yi yeniden üretmek gerekmez. Ardından:

```bash
npm run build
node scripts/render-cat-poster.mjs
npm run check
node scripts/browser-check.mjs
```

Poster script'i 4175'te preview açar; WebP/manifest ve `docs/verification/r4-live-render.png` yeniler. `npm run check` içindeki build son posteri dist'e taşır. Browser script'i 4173 kullanır, çıktıları `browser-results/` altına yazar. Yeni rapor/390px görüntü/metrikleri `docs/verification/` içine aktar; varlık hash'leri güncel olsun. Render metrikleri `artifacts/r4-render-metrics.json` içinde. Portlarda eski preview bırakma.

Bu turun kabulü: seçilen farklarda görünür ilerleme; 390px gerçek uygulamada temiz yüz/kürk; göz/ağız/patide açıklık veya döndürmede kürk kayması olmaması; altı klip/care önceliği; güncel WebP/hash/bütçe ve uygun regresyon/GLB/Chromium kontrolleri. Android ve kullanıcı görsel kabulünü açık olarak raporla. Mevcut PR dalına commit et; main'e birleştirme veya yayın yapma.

Doğrudan git erişimi engellenirse GitHub connector ile blob→tree→commit→`update_ref(expected_sha=okunan_head, force=false)` kullan; eski head ile dalı ezme. Commit/tree kimliklerini yerel kayıt dosyasında tut; geçici sohbet store'u tek kayıt olmasın. Ara gerçek render'ı erken üret; ilerleme ve kalan farkı kullanıcıya düzenli bildir.
