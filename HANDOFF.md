# Raund 4 — devir teslim

Repo: https://github.com/deus-ex-machina-18/Kalori-Takip
Dal: main · sürüm 0.4.0 · 6 Ekim 2026
Başlangıç: R3 teslim ef2df0b65ab10372e5dc89cb259439aa08389cb0.

## Durum

**Raund 4 görsel kalite revizyonu açık.** Kullanıcı mevcut modelin referans görsel kalitesinde olmadığını bildirdi. Aşağıdaki önceki teknik kabul görsel onay anlamına gelmez. Main'deki çalışan sürüm korunur; revizyon `r4-visual-quality` dalında ilerler. R5'e geçilmedi. Fiziksel Android performansı ölçülmedi; yayın yapılmadı.

Bağlantı kesintisi sonrası yerel çalışma alanı sıfırlandı. Önceki yeni model/sahne kaynakları GitHub'a aktarılmamıştı; o yerel test sonuçları bu daldaki kodun kanıtı sayılamaz. Üretilmiş beyaz kürk materyali kurtarıldı ve `assets/cat/` içinde kaynak/prompt ile kaydedildi. Model revizyonu yeniden kurulup yeniden doğrulanmalı. Doku tek başına referanstaki kaliteyi sağlamaz.

Doğrulanmış son kod: 1971754eb0de3d3b37697a28b84f85d4e5615f45. Bu belgenin sonraki commit'i yalnız devir belgelerini günceller.

## Kullanıcı seçimi

Üç ayrı örnek sunuldu; kullanıcı “1 hocam ama rengi gri-beyaz olsun” dedi. Yumuşak oyuncak yönü gri-beyaz, mobil için sadeleştirilmiş gerçek geometriyle uygulandı. Ayrıntılı kürk yok; referans PNG gerçek 3D model diye sunulmadı. Kedi adı Ayarlar'dan değiştirilebilir.

## Tamamlananlar

- Gerçek GLB/glTF 2.0 mesh ve skin; 14 kemik, 19.936 üçgen, 997.724 bayt, doku yok. Baş, iki kulak, kuyruk, patiler, göz ve ağız bağımsız animasyon izlerine sahip. idle/happy/stretch/play/sleep/care; loop/one-shot ve 0,25 sn geçiş. Basit tek oda.
- Özgün prosedürel kaynak `scripts/build-cat.mjs`; GLB, SHA-256/klip envanteri ve tam MIT lisans metni `public/models/` içinde. Ticari kullanım/değiştirme/web dağıtımı lisansla izinlidir. Dış mesh, doku veya ses kullanılmadı. Ses kapalı.
- Three.js/GLTFLoader/AnimationMixer dinamik yüklenir. Dokunma, yatay döndürme ve dikey kaydırma ayrılır; klavye düğmeleri, açı sıfırlama, oyun, gerinme ve uyku. Erişilebilir kedi adı/durum/metin, canvas dışı kontroller.
- Kedi durumu mevcut enerji motorundan gelir. Care kutlamayı/oyunu bastırır; kedinin beden boyutu kalorilerle değişmez. Kalori/plan/hareket/haftalık hesaplar ve beş ekran korunur.
- İsim/reducedMotion/sceneMode mevcut IndexedDB v1 CatPreferences store'unda. Profil zorunlu; aynı transaction'da ayar+makbuz, aynı işlem retry ve tam snapshot CAS. Şema migrasyonu yok. Profil öncesi cihazın hareket tercihi kullanılır.
- Statik PNG, aynı gerçek modelin nötr render'ıdır. Auto/statik seçim kalıcıdır; WebGL yokluğu, model 404/12 sn timeout, context kaybı veya düşük FPS'te yedek görünüm. Sahne hatası kalori formunu kapatmaz.
- DPR≤1.5, yaklaşık 30 FPS döngü, tek 512² gölge. Görünmez kart/sekmede döngü durur. Görünür 4 sn örnekte <20 FPS statik moda geçer. Gerçek Android FPS/yükleme kabulü ayrı açık gereksinimdir.

## Kontroller — başarılı

- Yerel `npm run check`: TypeScript + üretim build + 36 domain/depo + 20 DOM testi. R2/R3 regresyonları, kedi CAS/reload/retry, isim HTML güvenliği ve care önceliği geçti. GLB validator sıfır hata ve uyarı; bütçe ve bağımsız kemik animasyon izleri doğrulandı.
- Son gerçek Chromium koşusu: https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/37420124824
- Commit: 1971754eb0de3d3b37697a28b84f85d4e5615f45; artifact browser-check ID 11392532655; 70 PNG + report.json + r4-metrics.json; errors=[].
- Native IndexedDB ile R2/R3 ve R4 tercih retry/reload geçti. Gerçek GLB/WebGL2, döndürme/sürükleme/reset, play/stretch/sleep, care önceliği, yeniden kısmi/nötr gün, 404 ve gerçek WEBGL_lose_context, WebGL yokluğu, kalıcı statik/reduced motion, görünmez kartta durma/dönüşte devam ve yapay yavaş RAF'te düşük FPS yedeği geçti.
- 320/360/390/768/1280px boş/kayıtlı/3D ekranlar ve mevcut klavye/odak/reflow akışları geçti. 320px gerçek 3D ve 390px statik ekran son artifact'tan görsel olarak incelendi. Kontroller kaydırmayla erişilebilir; sabit alt navigasyon tam sayfa ekran görüntüsünde orta akışın üzerine çizilir.
- Chromium SwiftShader yazılım renderer: gölge geçişi dahil 40.580 çizilen üçgen, 22 draw call; yerel preview ilk render 213 ms. Bu internet bağlantısı veya fiziksel Android sonucu değildir. 640px reflow gerçek %200 zoom değildir.

Yerel Chromium indirmesi geçerli ZIP dönmedi; gerçek tarayıcı kabulü GitHub Actions'ta yapıldı. Bir ara koşu yalnız test betiğinin çoklu sekme context kurulumu yüzünden başarısız oldu; açık browser context ile düzeltildi, son koşu bütünüyle geçti.

## Çalıştırma

```bash
npm ci
npm run check
npm run dev
```

http://127.0.0.1:5173/#/bugun. GLB tekrar üretim: `npm run assets:cat`; validator: `npm run test:assets`. Gerçek tarayıcı: build sonrası `node scripts/browser-check.mjs` (Playwright Chromium gerekir). Kaynak geometri değişirse statik poster de güncel gerçek render'dan alınmalı.

## Açık bağımlılıklar

Fiziksel orta sınıf Android ≥30 FPS ve <3 sn ilk sahne hedefi, gerçek %200 zoom, ekran okuyucu ve klinik inceleme pilot öncesi açık. Tek cihaz/origin/yerel profil; login/yetki/senkronizasyon/yedekleme/hosting yok. Manifest tam offline/push değildir. MET belirsizliği kişisel ölçüm veya güven aralığı değildir. Ücretli hizmet açılmadı.

## Sonraki tek görev

**Raund 4 — mevcut gri-beyaz kedi yönünde görsel kalite revizyonunu tamamla.** Gerçek render referansla karşılaştırılmalı; kullanıcı kabulünden önce görsel görev tamamlandı denmez. Motorlar, bakım önceliği, kayıt güvenliği ve erişilebilir kontroller korunmalı. Sonraki R5 görevine henüz geçilmez.

Yeni görsel veya 3D yön için önce üç örnek ve kullanıcı seçimi şartı sürer. Mevcut gri-beyaz 1. yön için yetki zaten vardır.
