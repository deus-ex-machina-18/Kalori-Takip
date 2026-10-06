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

`check`: TypeScript, üretim build'i, 36 tarih/hesap/IndexedDB testi ve 20 DOM akış testi; ayrıca gerçek GLB validator ve bütçe kontrolü. Depo testleri fake-indexeddb, DOM testleri jsdom kullanır; gerçek tarayıcı kontrolü ayrıdır.

```bash
npx playwright install chromium
npm run build
node scripts/browser-check.mjs
```

GitHub Actions aynı Chromium kontrolünü çalıştırır: 320/360/390/768/1280px boş ve kayıtlı ekranlar, klavye/odak/navigasyon, gerçek IndexedDB ile profil/kalori/mod/kilo/yenileme ve saklama hatası sonrası tekrar deneme. `browser-check` artifact'ı görüntüleri ve raporu içerir. Son başarılı [Chromium koşusu](https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/37417506309): 50 test, R2 + R3 gerçek IndexedDB akışları ve yerleşim kabulü geçti; 58 görüntü ve hatasız rapor oluştu. Ayrıntı HANDOFF.md'de.

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

Manifest başlangıçtır; service worker/offline/push/install akışı henüz yok. Gri-beyaz kedi gerçek GLB/iskelet ve altı kliple çalışır; WebGL yoksa statik yedek gösterilir. Hareket hesabı, düzenlenebilir hareket/kalori planı ve son yedi kapalı günün değerlendirmesi çalışır. Ödül/bildirim ve yayın sonraki raundların kapsamıdır. Ayarlar’dan kedi adı, hareket azaltma ve statik mod kaydedilebilir. Ses kapalıdır.

## Sonraki sohbet

PROJECT.md, CURRENT_TASK.md, HANDOFF.md ve docs/DATA_CONTRACT.md'yi oku. R4 tarayıcı kabulü tamamlandıysa yalnız Raund 5’e geç; mevcut ekranları veya framework'ü yeniden başlatma. Enerji hesabının tek kaynağı src/domain/tracking.ts ve docs/ENERGY_POLICY.md'dir.

## 3D varlık

`public/models/grey-white-kitten.glb`: özgün prosedürel mesh, 14 kemik, 19.936 üçgen, 996.320 bayt, doku yok. Kaynak `scripts/build-cat.mjs`; MIT lisans metni ve hash/klip envanteri aynı klasörde. Yeniden üretim: `npm run assets:cat`; doğrulama: `npm run test:assets`.

Three.js/GLTFLoader yalnız Bugün sahnesinde dinamik yüklenir. Yatay sürükle veya erişilebilir düğmelerle döndür; açı sıfırlanabilir. Sahne görünmezken animasyon durur. DPR en fazla 1.5, 30 FPS hedefli döngü; ölçülen <20 FPS, context kaybı veya 404 statik yedeğe geçer. Fiziksel Android performansı henüz ölçülmedi; Chromium SwiftShader sonucu Android kabulü değildir.
