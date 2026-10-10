# Kedi Kalori · Raund 4

Türkçe, telefon öncelikli **manuel** kalori ve kilo takibi. Kalorini dışarıda hesapla; günlük toplamı veya yalnız kcal parçalarını buraya yaz.

## Çalıştırma

Node.js 22.12+ ve npm:

```bash
npm ci
npm run dev
```

Yerel adres: http://127.0.0.1:5173/#/bugun. Telefonda aynı ağ üzerinden kontrol için `npm run dev:lan` ve bilgisayarın IP'si:5173 kullanılır.

```bash
npm run check
npm run build
npm run preview
```

`check`: TypeScript, üretim build'i, 39 tarih/hesap/IndexedDB ve kalori-video sınır testi, 20 DOM akış testi; ayrıca aktif MP4/poster hash, bütçe ve fast-start kontrolü. Depo testleri fake-indexeddb, DOM testleri jsdom kullanır; gerçek tarayıcı kontrolü ayrıdır.

```bash
npx playwright install chromium
npm run build
node scripts/browser-check.mjs
```

GitHub Actions aynı Chromium kontrolünü çalıştırır: beş genişlikte boş/kayıtlı ekranlar, klavye/odak, gerçek IndexedDB, kayıt hatası/retry ve beş videonun gerçek decode/tek oynatma/beklemeye dönüş akışı. `browser-check` artifact'ı ekran görüntülerini ve raporu içerir. Fiziksel Android testi ayrı kabul adımıdır; güncel sonuç HANDOFF.md içindedir.

## Kullanım

1. Planım'da profilini gir; uygunluk sorusunu yanıtla, hedefini seç, önizle ve onayla. Otomatik plan kapsamı dışında plansız kayıt yapabilirsin.
2. Bugün'de toplam veya parçalı kcal gir. Bitirdiğinde **Günü tamamla**. Düzenleme günün durumunu yeniden kısmi yapar.
3. Kayıtlar’da geçmiş günü seç/düzenle, hareket kaydet/düzelt/sil veya kilo ölçümü ekle. Kilo düzeltmesi yeni ölçümdür; eski ölçüm korunur.
4. Planım’da uygun hareket günlerini/sürelerini düzenle veya sevdiğin aktivitelerle taslak oluştur; manuel kalori aralığı da aynı uygunluk sınırlarından geçer.
5. İlerlemem’de son yedi kapalı günü değerlendir; kayıt eksikse hedef değişmez.
6. Planı düzenlediğinde yeni sürüm ileri tarihli başlar; geçmiş günler kendi planına bağlı kalır.

Boş gün sıfır değildir. Hedef aralığını aşmak, koruma ihtiyacını aşmakla aynı şey değildir. Enerji tahmini gözlenen kilo değişiminden ayrıdır; olağan egzersiz PAL içinde olduğundan tekrar kalori eklenmez.

## Veri kapsamı

Tek profil ve tek tarayıcı/origin kapsamında **IndexedDB**. Gerçek hesapla giriş, güvenli çok kullanıcı izolasyonu, bulut senkronizasyonu ve yedekleme henüz yok. Site verisini temizlemek kayıtları silebilir. Origin değiştirmek diğer origin'deki kayıtları taşımaz. Saklama hatası açık gösterilir; belleğe sessiz fallback yapılmaz.

Manifest başlangıçtır; service worker/offline/push/install akışı henüz yok. Gri-beyaz kedi sabit açılı beş MP4 ile çalışır; video hatasında ortak WebP poster gösterilir. Hareket azaltma/statik tercih video indirmez. Hareket hesabı, düzenlenebilir hareket/kalori planı ve son yedi kapalı günün değerlendirmesi çalışır. Ödül/bildirim ve yayın sonraki raundların kapsamıdır. Ayarlar’dan kedi adı, hareket azaltma ve statik mod kaydedilebilir. Ses kapalıdır.

## Kedi videoları

Aktif medya `public/cat-media/`; tek envanter `asset-manifest.json`. Mevcut bekleme, hedef tuttu, hedef üstü/koruma altı, koruma üstü ve hedef altı klipleri kullanılır. Başarılı “Günü tamamla” kaydı tepkiyi bir kez oynatır; sonra beklemeye döner, sonuç yazısı kalır. Yenileme/navigasyon/geçmiş gün kaydı tepkiyi tekrar oynatmaz. Plan farkları mevcut enerji motorundan gelir. Bakım önceliği korunur. Oyun/esneme/uyku videoları bu pakette yok; eski 3D etkileşim düğmeleri aktif arayüzden kaldırılmıştır.

640×640, H.264 Constrained Baseline, yuv420p, 24 fps, sessiz, fast-start MP4. Kaynak 16 fps klipleri 24 fps'e dönüştürmek yeni hareket ayrıntısı üretmez. Paket/poster 1.539.538 bayt; ilk bekleme/poster 312.844 bayt. Klip sonları ortak bekleme karesine 0,25 sn çözünür. Hedef-altı kabın klip ortasında belirme/kayma kusuru devam eder; yeniden üretim adayıdır.

Tekrar hazırlama: `python3 scripts/prepare-cat-videos.py --source-dir /kaynaklar`. Kaynak klasörü aynı isimli beş orijinal MP4 içermeli; orijinaller değiştirilmez. Kaynak hash'leri envanterde. Eski GLB kaynakları tarihsel çalışma olarak korunur; aktif uygulama Three.js yüklemez.

## Sonraki sohbet

PROJECT.md, CURRENT_TASK.md ve HANDOFF.md'yi oku. Sonraki tek görev fiziksel Android'de video/görsel kabulüdür. Alternatif klip üretimi bu kontrolden sonra; R5 özelliklerini aynı tura ekleme. Enerji hesabının tek kaynağı src/domain/tracking.ts ve docs/ENERGY_POLICY.md'dir.
