# R4 devir teslim — sabit açılı animasyonlu kedi

Güncelleme: 6 Ekim 2026. Repo: https://github.com/deus-ex-machina-18/Kalori-Takip

**Dal: `r4-visual-quality`. Taslak [PR #1](https://github.com/deus-ex-machina-18/Kalori-Takip/pull/1). Son uygulama commit'i: `e5e35c3821cf55965743ae8a20cf824785db5d7a`. Bu devir ayrıca doküman commit'iyle kaydedilir; başlamadan PR'nin güncel head'ini kontrol et. Main bu uygulamayı içermiyor. Birleştirme ve yayın yapılmadı.**

## Onaylanan yöntem — 6 Ekim 2026, 16:21 İstanbul

Kullanıcı önce başka bir yaklaşım istedi, ardından **“Döndürme şart değil”** dedi. Seçilen yol: **sabit kamera açılı, önceden hazırlanmış görsel ve animasyonlarla gösterilen gri-beyaz kedi**. Görünüm 3D kalitesini hedefler; uygulamanın gerçek zamanlı GLB/kürk hesaplaması zorunlu değildir. Serbest döndürme, klavye ile döndürme ve açı sıfırlama kabul kriterinden çıkarıldı.

Bu karar aşağıdaki eski GLB/rig/katman gereksinimlerinin yerine geçer. Eski 3D uygulama ve ölçümleri geçmiş çalışma olarak korunur; yeni yöntemin kanıtı sayılmaz. Yeni yöntem henüz uygulama koduna geçirilmedi. Yeni karakter/stil seçilmiyor; mevcut gri-beyaz kimlik ve hedef kalite korunuyor. Yeniden üç örnek seçimi gerekmiyor.

## Sonraki tek görev

Referans kalitesine yakın tek bir gri-beyaz ana kedi görseli oluştur ve mevcut Bugün kartında sabit açılı göster. İnce doğal kürk, yüz oranları, sakin göz yansımaları ve sıcak ışığı bu ana karede çöz. İlk somut çıktı 390px gerçek uygulama ekran görüntüsü ve çalışan statik gösterimdir. Bu tur ana görsel kalitesine odaklanır; kapsamlı hareket paketini aynı tura yığma. Ana görüntüdeki kimlik ve kalite netleşince aynı karakterin idle/happy/stretch/play/sleep/care hareketlerine geçilir.

Başlangıçta bu üç görüntüyü gerçekten aç:

- **Hedef:** `docs/verification/r4-target-reference.png` — kullanıcının verdiği turuncu-beyaz kedi. Rengini kopyalama: ince doğal kürk, bebek kedi oranları, sakin göz yansımaları, yumuşak temas gölgesi ve sıcak oda ışığı kalite referansıdır. Uygulamada gri-beyaz korunur. Bu görsel lisanslı bir 3D model veya uygulama render'ı değildir.
- **Mevcut gerçek sahne:** `docs/verification/r4-live-render.png`. Aynı canlı GLB/shader/ışık 600 CSS px sahnede render edildi; bu büyük görüntü mobil performans kanıtı değildir.
- **Gerçek telefon düzeni:** `docs/verification/r4-mobile-390.png`. Kullanıcının göreceği boyutta yüzün ve kürkün okunurluğunu ayrıca değerlendir.

Tek teslim: yeni ana görseli kullanan sabit açılı kedi kartı, statik yedek, gerçek 390px uygulama görüntüsü ve uygun doğrulama; mevcut PR dalına kaydedilir. Görselin kaynağını/provenance bilgisini belirt. Üretilen görseli canlı GLB render'ı diye tanımlama. Teknik kontroller görsel kabulün yerine geçmez; kullanıcı görsel kabulü açık.

## Kararlar ve sınır

Kullanıcı üç örnek arasından **“1 hocam ama rengi gri-beyaz olsun”** seçimini yaptı; sabit açılı animasyon yöntemini ayrıca kabul etti. Aynı karakterin üretim/gösterim yöntemini değiştirmek için yeniden yön seçimi isteme. Karakterin görsel kimliğini veya stilini ayrıca değiştireceksen önce üç somut örnek göster ve seçim al.

Kedi kartı, sahne/gösterim adaptörü, ilgili stiller, yeni görsel varlıklar ve gerekli envanter/doğrulama dosyaları değişebilir. Mevcut catState/CatPreferences ve yaşam döngüsü arayüzlerini yeniden kullan. Kalori/aktivite/plan/haftalık hesap motorları, IndexedDB v1 şeması, beş ekran ve Vite + TypeScript DOM mimarisi korunur. R5 ödül/bildirim ve R6 export/silme/hosting ekleme. Kaloriye göre beden boyutu değişmez; düşük tüketimde `care` oyun/kutlamadan önceliklidir. Kalori formu sahneden bağımsız çalışır. Kalıcı kararlar `PROJECT.md`, aktif iş `CURRENT_TASK.md` içindedir.

## Devralınan 3D uygulama — geçmiş çalışma

- Kapalı SDF göz yuvaları, korneal iris kapağı ve daha sakin kahverengi gözler; burun/ağız, kaş ve bıyık yerleşimi; çanak kulaklar, yuvarlak parmaklar ve dolgun kuyruk.
- Yüzle hizalı pivotlar; 14 kemik, `idle/happy/stretch/play/sleep/care` klipleri.
- GLB'deki 22.500 geometrik kısa tüyün yanında **12 rigli underfur katmanı**. Aynı GLB vertex/skin buffer'ları ve iskelet kullanılır; ayrı kürk indirmesi yok. Düzensiz folikül kökleri ve sabit tüy bükülmesi.
- Sıcak ana ışık, azaltılmış dolgu/ortam yansıması, PCF soft gölge, dokulu yuvarlak halı ve sade duvar ışığı.
- Tam mod DPR≤1.5. İlk 4 sn örneğinde <26 FPS: DPR≤1, gölgesiz, 4 katman, yarım kısa tüy. Sonraki <20 FPS: statik yedek. Görünmez kart/sekmede animasyon durur.
- `public/models/cat-poster.webp` aynı gerçek sahneden üretildi. Eski aktif PNG kaldırıldı; büyük PNG yalnız doğrulama belgesidir.

## Devralınan dosya haritası — 3D sürüm

Yeni yöntem için öncelikli dosyalar kedi kartı, sahne adaptörü, ilgili stiller ve aktif varlık envanteridir. Geometri/underfur üreticilerini geliştirerek yeni yönü erteleme. Aşağıdaki GLB/shader dosyaları eski uygulamanın haritasıdır.

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

## Eski 3D sürümde doğrulananlar ve açık sorunlar

`e5e35c3` uygulaması için TypeScript/üretim build'i; **36 domain/depo + 20 DOM = 56 test**; GLB validator sıfır hata/uyarı; kapalı beyaz kaplama ve hash/bütçe kontrolleri geçti. `docs/verification/r4-browser-report.json` içinde `errors=[]`, varlık hash'leri ve doğrulama tarihi var. Yeni değişikliğe eski test sonucunu atfetme.

Gerçek Chromium: 320/360/390/768/1280 genişlikte beş ekran, native IndexedDB kayıt/yeniden yükleme/retry, klavye/odak ve taşma; gerçek model/shader, sürükleme/döndürme/reset; model/albedo 404, WebGL yokluğu/context kaybında kalori formu; statik tercih, hareket azaltma ve 12→4→statik geçişi geçti. Kısa animasyonlar **160px software backbuffer'da ayrı yeni sahnelerle** kontrol edildi; tam boy sürekli animasyon performansı kabul edilmedi.

| Ölçüm | Sonuç |
|---|---|
| GLB geometri | 48.380 üçgen: 25.880 temel + 22.500 kısa tüy |
| GLB + albedo + aktif poster | 4.518.156 byte; ≤5 MiB |
| Tam render, gölge dahil | 281.366 çizilen üçgen, 42 draw call; sınır 300.000 |
| Yerel SwiftShader yükleme | Son iki koşu 1.488 / 2.079 ms; Android/internet ölçümü değil |

**Açık:** referansın doğal kürk/ışık kalitesine ulaşılmadı; görünüm hâlâ oyuncak hissi veriyor. Katmanlar GPU yükünü artırdı. Fiziksel Android'de ≥30 FPS ve <3 sn hedefleri ölçülmedi. Bu cihaz kabulü ayrı açık gereksinimdir; software Chromium ile kapatma. Son uygulama commit'i için GitHub CI sonucu ayrıca doğrulanmalı.

## Eski 3D çalışmadan notlar — yeni yöntemi engellemez

- Underfur `bindMode` kaynak coat'tan alınır; aynı skeleton/bindMatrix ve parent transform'u korunur. Detached bağlama/world transform'u iki kez uygulama kürkü döndürmede kaydırdı.
- Iris winding/normallerini koru. Aşırı clearcoat/ortam yansıması gözü metal küreye benzetti; validator bunu yakalamaz.
- PCF bilinçli seçildi; VSM'de kürk receiver'ları ilave gölge çizimine girip yükü artırdı. Değişiklikten sonra gerçek render sayısını ölç.
- SwiftShader uzun animasyonda statik moda geçebilir. FPS eşiklerini gevşeterek testi geçirme; kısa mekanik ve uzun yedek geçiş testlerini ayrı tut.
- GLB üçgen sayısı runtime katman/gölge sayısı değildir. Yalnız GLB ≤50 bin diye GPU yükünün düşük olduğunu söyleme.
- Sahne/model değişince poster ve hash'leri yenile. Üretilmiş hedef resmi gerçek uygulama render'ı diye sunma.

## Yeni yöntemin uygulama ve kabul sırası

1. Güncel PR head'ini al; bu yöntemi kabul eden kararın uygulama koduna henüz geçmediğini kontrol et. Node ≥22.12 (CI 24), npm. Başlangıç kontrolü: `npm ci`, `npm run check`.
2. `r4-target-reference.png` üzerinden tek kaliteli gri-beyaz ana görsel oluştur. Görsel üretme/düzenleme için imagegen kullan; kaynak/prompt/varlık envanterini kaydet. Eski düşük kaliteli render'ı yalnız büyüterek yeni ana görsel diye sunma.
3. Ana görseli gerçek kedi kartına bağla. Yüz/kürk 390px genişlikte okunmalı; patiler/kulaklar gereksiz kırpılmamalı. İlk gerçek ekran görüntüsünü erken üret ve kullanıcıya göster.
4. Hesap motoru ve IndexedDB v1 değişmez. İsim, statik mod, hareket azaltma, care önceliği ve kalori formunun bağımsızlığı korunur. Yeni yöntemde geçersiz olan döndürme/sıfırlama kontrollerini kaldır; scroll ve dokunma ayrımı erişilebilir kalır.
5. Ana görsel sonrasında hazırlanacak hareketler aynı karakter/kamera/ışığı korur. Video veya kontrollü kare dizileri için küçük bir gösterim adaptörü kullan; klip geçişleri, tek seferlik hareket sonrası idle dönüşü, gizli kart/sekmede durma ve hareket azaltma uygulanır. Tüm klipleri başlangıçta indirme. Animasyon yükleme/decode hatasında kaliteli ana kare ve kalori formu kalır.
6. Aktif görselin boyut/hash/provenance envanteri tek yerde tutulur. İlk gerekli medya için mevcut ≤5 MiB sınırı korunur; tüm animasyon paketi ve decode belleği ayrıca ölçülür. Eski GLB üçgen/katman bütçesi yeni medyaya uygulanmaz. Mobil yükleme/pil/decode performansı ölçülmeden “daha hızlı” diye kesin sonuç verme.
7. TypeScript/build ve domain/DOM regresyonlarını çalıştır. `scripts/browser-check.mjs` mevcut GLB, 12/4 katman ve döndürme varsayımları içerir; bunları sabit açılı medya kabulüne göre güncelle. Beş ekran/genişlik, IndexedDB/retry/odak, formun bağımsızlığı, statik tercih ve medya hata kontrollerini koru. Yeni ana görsel veya hareketler için eski 56 test sonucunu başarı kanıtı sayma.
8. Mevcut PR dalına kod/varlık/güncel ekran görüntüsü/raporları kaydet; main'e birleştirme veya yayın yapma. Android cihaz kabulü ve kullanıcı görsel kabulü açık olarak raporlanır.

Eski `assets:cat` ve `render-cat-poster.mjs` komutları GLB sahnesini üretir; yeni ana görsel için bu yol zorunlu değildir. Yeni varlığın dağıtılan sürümü ile ekran görüntüsü/hash'lerin aynı olması gerekir.

Doğrudan git erişimi engellenirse GitHub connector ile blob→tree→commit→`update_ref(expected_sha=okunan_head, force=false)` kullan; eski head ile dalı ezme. Commit/tree kimliklerini yerel kayıt dosyasında tut. Ara gerçek ekran görüntüsünü erken üret; ilerleme ve kalan farkı kullanıcıya düzenli bildir.
