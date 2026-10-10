# Kedi Kalori — proje kararları

Sürüm: 0.4.0 · 6 Ekim 2026 · Raund 4
Repo: https://github.com/deus-ex-machina-18/Kalori-Takip · ana dal: main

## Ürün

Kedinin kullanıcı tarafından belirlenen adı **Zilli** (10 Ekim 2026). Varsayılan adın tek kaynağı `src/domain/cat.ts`. Daha önce Ayarlar'dan kaydedilmiş özel adlar zorla değiştirilmez. Eski doğrulama ekranlarında “Duman” test adı görünebilir; yeni tasarımda Zilli kullanılır.

Türkçe, telefon öncelikli manuel günlük kalori takibi. Geçici ad **Kedi Kalori**; mevcut sıcak krem/adaçayı/şeftali arayüz korunur. Kullanıcı üç örnek arasından 1. yumuşak oyuncak yönünü gri-beyaz renkle seçti. Önce gerçek GLB üretildi; 6 Ekim 2026'da kullanıcı döndürmenin şart olmadığını belirterek sabit açılı, önceden hazırlanmış görsel/animasyon yöntemini kabul etti. Görsel kimlik gri-beyaz kalır; 10 Ekim 2026’da mevcut beş video ile uygulamaya geçirildi. Beş ekran: Bugün, Kayıtlar, Planım, İlerlemem, Ayarlar. Kullanıcı kaloriyi dışarıda hesaplar; uygulama toplamı veya yalnızca kcal parçalarını kabul eder. Besin kataloğu, fotoğraf/barkod/porsiyon hesabı ve LLM yok.

Boş gün sıfır değildir. Hedef aşımı ile koruma ihtiyacı üzerindeki tüketim ayrıdır. Eksik veriye kesin sonuç/ödül verilmez; az yeme yarışı ve egzersiz borcu yok. Kedi günün kalorileriyle fiziksel olarak değişmez veya cezalandırmaz.

## Teknik seçim

- Vite 8 + TypeScript 5.9, framework kullanmayan DOM arayüzü; küçük başlangıç paketi, statik hosting ve Android tarayıcı erişimi için yeterli. Node >=22.12, kilit dosyası npm ile izlenir. Üretim çıktısı `dist/`; hash navigasyonu sunucuda özel rewrite gerektirmez.
- Mobil web, PWA yönünde ilerleme. Manifest ve SVG ikon mevcut. Service worker/offline/push/install prompt bu raundda yok. Manifest, tam PWA kurulum desteği iddiası değildir; HTTPS ve platforma uygun raster ikonlar sonraki yayın gereksinimi.
- Hosting: ücretli servis açılmadı, domain alınmadı, yayın yapılmadı. `dist/` ileride Netlify, GitHub Pages veya eşdeğer HTTPS statik host üzerinde yayınlanabilir. Hosting hesabı bağlanmış değil.
- Kalıcı veri: Raund 2'de uygulandı — **cihazda yerel pilot**, IndexedDB v1, repository arayüzü üzerinden. Bellekte demo yeterli değil. UUID yerel profil kimliği; tarayıcı/origin kapsamı. Gerçek oturum açma veya güvenli hesap izolasyonu sayılmaz. Aynı cihazı paylaşanlar için güvenlik iddiası yok; farklı cihazlarda senkronizasyon yok; site verisini temizlemek veriyi silebilir. Bulut davetli pilotu tamamlanmış sayılmayacak.
- Çok kullanıcıya geçiş ayrı altyapı bağımlılığı: sunucu tarafından doğrulanmış kimlik ve kullanıcı bazlı yetkilendirilmiş depolama gerekir. Sağlayıcı henüz seçilmedi. Repository `authenticated-cloud` adaptörüne hazır; yalnız istemciden gelen userId'ye güvenilemez.
- Bağımlılıklar: TypeScript Apache-2.0, Vite MIT, yalnız testlerde jsdom MIT; çalışma zamanı harici API/CDN/font gerektirmez. Paketlerin transitif lisansları kilit dosyasıyla takip edilir. R1 servis maliyeti 0; ücretsiz plan kotaları hosting sağlayıcısı seçildiğinde kontrol edilecek. Ücretli model/hosting aboneliği başlatılmadı.

## Tek doğruluk kaynakları

- Renk/boşluk/yazı: `src/styles.css` içindeki `:root` tokenları.
- Ekran navigasyonu: `src/main.ts` içindeki navigation listesi.
- Veri tipleri: `src/domain/models.ts`; adaptör ve hesap arayüzleri: `src/domain/contracts.ts`.
- Veri davranışı: `docs/DATA_CONTRACT.md`; doğrulama/hesap: `src/domain/tracking.ts`; atomik adaptör: `src/data/indexeddb.ts`.
- Enerji/sınır kararları ve kaynaklar: `docs/ENERGY_POLICY.md`; R2 motoru bu politikayı uygular, UI formül kopyalamaz.
- Güncel kedi yöntemi/sınırı: `CURRENT_TASK.md`; aktif varlık envanteri `public/cat-media/asset-manifest.json`. `docs/CAT_ASSET_REQUIREMENTS.md` içindeki GLB şartları önceki 3D sürümün tarihsel envanteridir.

## Erişilebilirlik ve tasarım

Alt navigasyon mobilde sabit, masaüstünde üstte. Yerel sistem fontları, görünür odak, içeriğe geç bağlantısı, semantik başlıklar, en az 48px navigasyon/kontrol yüksekliği. Sayfa değişiminde odak başlığa gider. Hareket azaltma başlangıçta cihaz tercihini kullanır; profil sonrası kullanıcı Ayarlar’dan CatPreferences içinde kalıcı olarak kaydedebilir. Statik görünüm de aynı kayıtta saklanır.

R2 kullanıcı onayıyla profil ve plan üretir; manuel kalori ve kilo kaydını IndexedDB'de tutar. R3 hareket/plan düzenleme/haftalık değerlendirme eklendi. R4 gerçek rigli GLB, sahne ve kedi ayarlarını ekler; R5–6 kapsamları etiketli kalır. Aynı gerçek modelin statik WebP render’ı sahne hata yolunda kullanılır. Gerçek Android ve ekran okuyucu testi pilot öncesi gereklidir.

## Değişiklik disiplini

Her raund aynı depoda ilerler. CURRENT_TASK.md güncel sınırı; HANDOFF.md kontrolleri ve sonraki tek işi taşır. Mevcut şema sessizce değiştirilmez; migrasyon gerekir. Geçmiş plan sürümleri değişmez. Bir raundun testleri geçmeden sonraki raund başlamaz. Gizli anahtarlar repoya konmaz.

## Raund 3 kararları

- Aktivite kaydı/düzeltme/onaylı silme cihazdaki mevcut activities store’unu kullanır. Hesap kodları ve katsayılar `src/domain/activity.ts`, haftalık değerlendirme `src/domain/weekly.ts` içindedir. Inclusive PAL politikası aynıdır; brüt aktivite harcaması enerji dengesine eklenmez.
- Otomatik hareket taslağı seçilen günlere sevilen aktiviteleri sırayla yerleştirir. Süreler ürünün başlangıç tercihleridir, klinik egzersiz reçetesi değildir. Manuel hareket günleri ve kalori aralığı aynı onay/ileri tarih/uygunluk sınırlarını korur.
- Son yedi kapalı yerel günün değerlendirmesi R2 devir talimatına göre R3’te uygulandı. R5’te geri bildirim, ödül ve hatırlatma eklenecek; şimdi hedefler otomatik düşürülmez.
- Yeni görsel veya 3D çalışmada önce üç ayrı örnek hazırlanır, kullanıcı seçmeden nihai yön veya asset üretilmez. R3 var olan tasarım tokenlarını kullanır; yeni görsel/3D üretilmedi. Bu şart R4 devrine taşınır.

## Raund 4 — uygulanmış 3D sürümün kararları

- 1. stil, gri-beyaz renk kullanıcı tarafından seçildi. Özgün prosedürel mesh/iskelet/klip kaynağı `scripts/build-cat.mjs`; GLB, manifest ve MIT lisans metni `public/models/` içinde. Üç örnek görsel modelin içine gömülmez.
- Three.js 0.186.1 (MIT), GLTFLoader ve AnimationMixer yalnız Bugün sahnesinde dinamik yüklenir. Harici model API'si, CDN veya ücretli varlık yok. gltf-validator yalnız geliştirme/kabul bağımlılığıdır.
- CatPreferences mevcut v1 store'unda tutulur; snapshot CAS WriteContext'e eklendi, IndexedDB şeması değişmedi. Profil olmadan kalıcı tercihler yazılmaz; cihaz tercihi oturum başlangıcında kullanılabilir.
- Kalori hesabı sahneden ayrıdır. UI catState'i enerji motorundan alır; care happy/play/stretch'i bastırır. Gün kalorileri kedinin beden geometrisini değiştirmez.
- Fiziksel Android ≥30 FPS ve <3 sn hedefleri ölçülmeden doğrulanmış sayılmaz. Chromium SwiftShader yalnız renderer/etkileşim/hata yolu kabulüdür.

R4 görsel kabulü açık. Sürüm 4: kapalı göz yuvaları, korneal iris yüzeyi, çanak kulaklar, parmaklar ve yüzle hizalı rig; gerçek kısa tüyler ile aynı skin buffer'larını kullanan underfur. Render ayarlarının tek kaynağı `assets/cat/render-settings.json`; varlık/hash/boyut envanteri `public/models/asset-manifest.json`. Statik WebP aynı canlı sahneden kodlanır; büyük PNG yalnız `docs/verification/` içindeki görsel kanıttır. Katmanların GPU yük artışı fiziksel Android kabulü yerine geçmez. Ücretli/stock kedi yok; kalori motorları ve v1 şema korunur. Referansın kürk/ışık kalitesine birebir ulaşıldığı iddia edilmez. R5 ve yayın açık; doğrulama HANDOFF.md'de.

## R4 — 6 Ekim 2026'da onaylanan yeni yöntem

Kullanıcı serbest döndürmeyi zorunlu tutmuyor. Güncel yön sabit açılı, önceden hazırlanmış yüksek kaliteli gri-beyaz kedi görseli ve animasyonlarıdır. Bu karar eski gerçek zamanlı GLB/rig/underfur ve döndürme zorunluluklarını kaldırır. Aynı görsel kimlikte yeniden üç örnek seçimi gerekmez; ayrıca yeni stil seçilecekse önceki üç örnek kuralı sürer.

Önce kaliteli ana kare gerçek Bugün kartında gösterilir; ardından aynı karakterin altı hareket/durum paketi hazırlanır. Yeni gösterim mevcut catState/CatPreferences ve yaşam döngüsü sınırlarını kullanır. Statik tercih, hareket azaltma, care önceliği, gizliyken durma ve medya hatasında formun çalışması korunur. Kalori motorları ve IndexedDB v1 değişmez. Aktif medya boyut/hash/provenance bilgisi tek envanterde tutulur; GLB katman/üçgen sınırı yeni medyaya uygulanmaz. İlk gerekli medya ≤5 MiB, diğer hareketler ihtiyaçta yüklenir.

Yeni yöntem 10 Ekim 2026’da uygulamaya geçirildi. Eski test/performans ölçümleri yeni yöntemin kabulü değildir. Android ve kullanıcı görsel kabulü açık; R5'e geçiş, birleştirme ve yayın bu turun kapsamı dışında.

## 10 Ekim 2026 — aktif video yöntemi

Bugün kartı `src/ui/cat-video.ts` ile beş mevcut MP4 kullanır. `src/ui/cat-result.ts` yalnız motorun DaySummary farklarını gösterir; eşikler tekrar kodlanmaz. Başarılı bugünkü tamamlama kaydı tek kullanımlık olay üretir; yenileme/navigasyon olay üretmez. Olay/oynatım geçmişi için veri şeması değiştirilmez. Sonuç yazısı kayıtlı summary'den kalır. Motor care önceliği korunur.

Kare medya kırpılmaz; MP4 sessiz Baseline/fast-start; reaksiyonlar gerektiğinde yüklenir. Statik/hareket azaltma sadece ortak ilk kareden poster. Kart/sekme gizliyken video durur, medya hatası bağımsız kalori formunu etkilemez. Dönüş son 0,25 sn ortak başlangıca çözünür. Kaplı klibin içindeki belirme/kayma kusuru bilinen üretim sorunudur. Oyun/esneme/uyku ve alternatif tepkiler fiziksel telefon kabulünden sonra ayrı iştir. Eski GLB kaynak/varlıkları tarihsel olarak korunur; aktif kedi kartı onları yüklemez. Yeni yayın ve Android kabulü yapılmış sayılmaz.

## 11 Ekim 2026 — geçerli görsel kararlar

- Uygulama adı Kalori Takip; varsayılan kedi Zilli. Kullanıcının altı referansı onaylı görsel yönün kaynağıdır; yeniden üç örnek/seçim gerekmez.
- Altı ekran: Bugün, Kayıtlar, Planım, İlerlemem, Sosyal, Ayarlar. Mobil alt navigasyon masaüstünde de telefon genişliğindeki uygulama kabuğunda kalır.
- Krem desenli zemin, orman yeşili, altın süslemeli çerçeveler; serif başlıklar. Tokenlar `src/styles.css`, ortak dekoratif varlıklar `public/design`, URL/varlık yardımcıları `src/ui/design.ts`.
- Zilli'nin videoları ve hesap motoruna bağlı tepki politikası korunur. Kare videolar `object-fit: contain` ile kırpılmadan gösterilir.
- Referansın ikonları ve nötr kedi resmi kullanıcı tarafından sağlanan çizimden yeniden kullanıldı. Raster sayfa ekran görüntüsü etkileşimli UI yerine konmadı.
- Su kaydı `kalori-water-v1:<userId>` altında yerel gün bazında; kalori IndexedDB şeması değişmez. Sosyal paylaşım, kimlik ve yetkili sunucu kurulmadan aktif görünmez.
- Referanstaki örnek sayılar, isimler ve grup üyeleri gerçek kullanıcı verisi gibi gösterilmez.
- Bu kararlar önceki görsel/3D yön açıklamalarının yerini alır; tarihsel teknik kayıtlar geçmiş çalışmaların açıklamasıdır.
