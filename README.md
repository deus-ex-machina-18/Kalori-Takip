# Kedi Kalori · Raund 2

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

`check`: TypeScript, üretim build'i, 21 tarih/hesap/IndexedDB testi ve 14 DOM akış testi. Depo testleri fake-indexeddb, DOM testleri jsdom kullanır; gerçek tarayıcı kontrolü ayrıdır.

```bash
npx playwright install chromium
npm run build
node scripts/browser-check.mjs
```

GitHub Actions aynı Chromium kontrolünü çalıştırır: 320/360/390/768/1280px boş ve kayıtlı ekranlar, klavye/odak/navigasyon, gerçek IndexedDB ile profil/kalori/mod/kilo/yenileme ve saklama hatası sonrası tekrar deneme. `browser-check` artifact'ı görüntüleri ve raporu içerir. Son başarılı [Chromium koşusu](https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/37375600559): 35 test, gerçek IndexedDB akışları ve yerleşim kabulü geçti; 56 görüntü ve hatasız rapor oluştu. Ayrıntı HANDOFF.md'de.

## Kullanım

1. Planım'da profilini gir; uygunluk sorusunu yanıtla, hedefini seç, önizle ve onayla. Otomatik plan kapsamı dışında plansız kayıt yapabilirsin.
2. Bugün'de toplam veya parçalı kcal gir. Bitirdiğinde **Günü tamamla**. Düzenleme günün durumunu yeniden kısmi yapar.
3. Kayıtlar'da geçmiş günü seç/düzenle veya kilo ölçümü ekle. Kilo düzeltmesi yeni ölçümdür; eski ölçüm korunur.
4. Planı düzenlediğinde yeni sürüm ileri tarihli başlar; geçmiş günler kendi planına bağlı kalır.

Boş gün sıfır değildir. Hedef aralığını aşmak, koruma ihtiyacını aşmakla aynı şey değildir. Enerji tahmini gözlenen kilo değişiminden ayrıdır; olağan egzersiz PAL içinde olduğundan tekrar kalori eklenmez.

## Veri kapsamı

Tek profil ve tek tarayıcı/origin kapsamında **IndexedDB**. Gerçek hesapla giriş, güvenli çok kullanıcı izolasyonu, bulut senkronizasyonu ve yedekleme henüz yok. Site verisini temizlemek kayıtları silebilir. Origin değiştirmek diğer origin'deki kayıtları taşımaz. Saklama hatası açık gösterilir; belleğe sessiz fallback yapılmaz.

Manifest başlangıçtır; service worker/offline/push/install akışı henüz yok. Kedi hâlâ 2D taslak. Hareket hesabı, haftalık uyarlama, gerçek 3D, ödül/bildirim ve yayın sonraki raundların kapsamıdır.

## Sonraki sohbet

PROJECT.md, CURRENT_TASK.md, HANDOFF.md ve docs/DATA_CONTRACT.md'yi oku. R2 kabulü tamamlandıysa yalnız Raund 3'e geç; mevcut ekranları veya framework'ü yeniden başlatma. Enerji hesabının tek kaynağı src/domain/tracking.ts ve docs/ENERGY_POLICY.md'dir.
