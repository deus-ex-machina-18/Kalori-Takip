# Raund 3 — devir teslim

Repo: https://github.com/deus-ex-machina-18/Kalori-Takip
Dal: main · sürüm 0.3.0 · 6 Ekim 2026
Başlangıç: R2 doğrulanmış teslim 6c5622d0d468ae5d56da49fb5b0af0abbb78da84.

## Durum

**Raund 3 tamamlandı ve main’de.** TypeScript, üretim build’i, 50 test ve gerçek Chromium kabulü geçti. Yayın yapılmadı.

Son doğrulanmış kod: 9183e109823dcba397f1feba233fb935ad1920f3. Bu belgeyi kaydeden sonraki commit yalnız devir belgelerini değiştirir.

## Tamamlananlar

- Yürüyüş/koşu/bisiklet/salon-kuvvet CRUD, geçmiş gün, seçime uygun tempo, dakika/kilo, kaynak kodu ve brüt tahmin aralığı. Gerçek IndexedDB v1 store; atomik makbuz, aynı işlem retry ve tam snapshot CAS.
- Inclusive PAL korunur: aktivite günlük hedef veya enerji açığına ikinci kez eklenmez. Kuvvet için geniş belirsizlik; egzersiz borcu/telafi kartı yok.
- Hareket günleri/süreleri ve sevilen aktivitelerden taslak; kontrollü manuel kalori aralığı; önizleme/geri dönüş/onay ve ileri tarihli immutable sürüm. Hedefe ulaşılan son ölçümden isteğe bağlı koruma önizlemesi.
- Son yedi kapalı yerel günün özeti; tamamlananların ortalaması, hareket ve ölçüm günleri. Tek planla yedi tamamlanan gün ve care olmaması halinde kullanıcı planı gözden geçirebilir. Kilo farkı yeterli farklı ölçüm günü/aralıkla gözlenen değişim olarak sunulur; otomatik kcal azaltma yok.
- Mevcut framework/beş ekran/tokenlar ve R2 kalori/kilo akışları korundu. Yeni görsel/3D üretilmedi.

## Kontroller

Yerel: Node 24.19.0; npm ci başarılı. npm run check başarılı: TypeScript + üretim build + 50 test (32 domain/depo, 18 DOM). Gerçek Chromium kabulü de başarılı. Yeni hesap/CAS/hafta/plan ve UI regresyon testleri eklendi.

Yerel Chromium indirmesi ağ ortamında geçerli ZIP dönmedi. Bu nedenle yerel gerçek tarayıcı kabulü yapılmış sayılmaz. GitHub Actions mevcut Chromium kontrolü R3 native IndexedDB CRUD/retry/plan kalıcılığı ve 320/360/390/768/1280px boş/kayıtlı/editor ekranlarıyla genişletildi.

### Gerçek Chromium kabulü — başarılı

- Son koşu: https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/37417506309
- Doğrulanmış commit: 9183e109823dcba397f1feba233fb935ad1920f3; artifact browser-check, ID 11391987360, 58 PNG + report.json, errors=[].
- Native IndexedDB ile aktivite ekleme/düzeltme/silme, silme iptali, reload, saklama hatası ve aynı işlemi retry; günlük enerji dengesinin korunması; hareket taslağı önizleme/geri dönüş/onay ve reload kalıcılığı geçti.
- R2 profile/650+800+500/tamamlama/reload/mod değişimi/kalori retry/kilo akışları hâlâ geçti. 320/360/390/768/1280px boş ve kayıtlı beş ekran, plan editörü, klavye/odak/geri-ileri/reduced-motion kontrolleri başarılı. 640px reflow %200 eşdeğeridir; gerçek zoom veya Android değildir.
- 320px plan editörü, Kayıtlar ve İlerlemem ile 390px hareket planı önizlemesi görsel olarak incelendi. Alanlar sığıyor; kabulü engelleyen sorun görülmedi. Plan formunda mevcut eligibility CSS kuralının sayı alanlarını daraltması düzeltildi ve son koşu düzeltmeyi içeriyor.

## Çalıştırma

```bash
npm ci
npm run check
npm run dev
```

http://127.0.0.1:5173/#/bugun. Tarayıcı kabulü: build sonrası node scripts/browser-check.mjs (Playwright Chromium gerekir).

## Açık bağımlılıklar

Tek cihaz/origin, tek yerel profil; gerçek login/yetki/senkronizasyon/yedekleme/hosting yok. Manifest tam offline/push değildir. Fiziksel Android, gerçek tarayıcı %200 zoom, ekran okuyucu, klinik inceleme ve tam NICE sayfası kontrolü pilot öncesi açık. MET aralıkları ürün sunum kararıdır; kişisel ölçüm/güven aralığı değildir. R5 kalıcı hafta geri bildirimi/ödüller/bildirim ve R6 veri/yayın işlemleri eklenmedi.

## Sonraki tek görev

R3 kabulü kapandı. Sonraki tek iş yalnız **Raund 4 — gerçek 3D kedi**. PROJECT/CURRENT_TASK/DATA_CONTRACT/ENERGY_POLICY ve docs/CAT_ASSET_REQUIREMENTS.md okunmalı; kalori/plan motoru yeniden yazılmaz.

**Kullanıcı şartı:** herhangi yeni görsel veya 3D çalışma için önce üç ayrı örnek hazırlanır ve kullanıcı uygun olanı seçer. Kullanıcı seçmeden nihai görsel/3D yön, model veya estetik kilitlenmez. Referans resim gerçek GLB/rig/animasyon yerine geçmez. Lisanslı asset ve gerçek Android performansı ayrıca doğrulanır.
