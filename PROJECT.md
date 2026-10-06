# Kedi Kalori — proje kararları

Sürüm: 0.4.0 · 6 Ekim 2026 · Raund 4
Repo: https://github.com/deus-ex-machina-18/Kalori-Takip · ana dal: main

## Ürün

Türkçe, telefon öncelikli manuel günlük kalori takibi. Geçici ad **Kedi Kalori**; mevcut sıcak krem/adaçayı/şeftali arayüz korunur. Kullanıcı üç örnek arasından 1. yumuşak oyuncak yönünü gri-beyaz renkle seçti; gerçek GLB bu seçime göre üretildi. Beş ekran: Bugün, Kayıtlar, Planım, İlerlemem, Ayarlar. Kullanıcı kaloriyi dışarıda hesaplar; uygulama toplamı veya yalnızca kcal parçalarını kabul eder. Besin kataloğu, fotoğraf/barkod/porsiyon hesabı ve LLM yok.

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
- 3D varlık gereksinimi: `docs/CAT_ASSET_REQUIREMENTS.md`.

## Erişilebilirlik ve tasarım

Alt navigasyon mobilde sabit, masaüstünde üstte. Yerel sistem fontları, görünür odak, içeriğe geç bağlantısı, semantik başlıklar, en az 48px navigasyon/kontrol yüksekliği. Sayfa değişiminde odak başlığa gider. Hareket azaltma başlangıçta cihaz tercihini kullanır; profil sonrası kullanıcı Ayarlar’dan CatPreferences içinde kalıcı olarak kaydedebilir. Statik görünüm de aynı kayıtta saklanır.

R2 kullanıcı onayıyla profil ve plan üretir; manuel kalori ve kilo kaydını IndexedDB'de tutar. R3 hareket/plan düzenleme/haftalık değerlendirme eklendi. R4 gerçek rigli GLB, sahne ve kedi ayarlarını ekler; R5–6 kapsamları etiketli kalır. Aynı gerçek modelin statik PNG render’ı sahne hata yolunda kullanılır. Gerçek Android ve ekran okuyucu testi pilot öncesi gereklidir.

## Değişiklik disiplini

Her raund aynı depoda ilerler. CURRENT_TASK.md güncel sınırı; HANDOFF.md kontrolleri ve sonraki tek işi taşır. Mevcut şema sessizce değiştirilmez; migrasyon gerekir. Geçmiş plan sürümleri değişmez. Bir raundun testleri geçmeden sonraki raund başlamaz. Gizli anahtarlar repoya konmaz.

## Raund 3 kararları

- Aktivite kaydı/düzeltme/onaylı silme cihazdaki mevcut activities store’unu kullanır. Hesap kodları ve katsayılar `src/domain/activity.ts`, haftalık değerlendirme `src/domain/weekly.ts` içindedir. Inclusive PAL politikası aynıdır; brüt aktivite harcaması enerji dengesine eklenmez.
- Otomatik hareket taslağı seçilen günlere sevilen aktiviteleri sırayla yerleştirir. Süreler ürünün başlangıç tercihleridir, klinik egzersiz reçetesi değildir. Manuel hareket günleri ve kalori aralığı aynı onay/ileri tarih/uygunluk sınırlarını korur.
- Son yedi kapalı yerel günün değerlendirmesi R2 devir talimatına göre R3’te uygulandı. R5’te geri bildirim, ödül ve hatırlatma eklenecek; şimdi hedefler otomatik düşürülmez.
- Yeni görsel veya 3D çalışmada önce üç ayrı örnek hazırlanır, kullanıcı seçmeden nihai yön veya asset üretilmez. R3 var olan tasarım tokenlarını kullanır; yeni görsel/3D üretilmedi. Bu şart R4 devrine taşınır.

## Raund 4 kararları

- 1. stil, gri-beyaz renk kullanıcı tarafından seçildi. Özgün prosedürel mesh/iskelet/klip kaynağı `scripts/build-cat.mjs`; GLB, manifest ve MIT lisans metni `public/models/` içinde. Üç örnek görsel modelin içine gömülmez.
- Three.js 0.186.1 (MIT), GLTFLoader ve AnimationMixer yalnız Bugün sahnesinde dinamik yüklenir. Harici model API'si, CDN veya ücretli varlık yok. gltf-validator yalnız geliştirme/kabul bağımlılığıdır.
- CatPreferences mevcut v1 store'unda tutulur; snapshot CAS WriteContext'e eklendi, IndexedDB şeması değişmedi. Profil olmadan kalıcı tercihler yazılmaz; cihaz tercihi oturum başlangıcında kullanılabilir.
- Kalori hesabı sahneden ayrıdır. UI catState'i enerji motorundan alır; care happy/play/stretch'i bastırır. Gün kalorileri kedinin beden geometrisini değiştirmez.
- Fiziksel Android ≥30 FPS ve <3 sn hedefleri ölçülmeden doğrulanmış sayılmaz. Chromium SwiftShader yalnız renderer/etkileşim/hata yolu kabulüdür.

R4 kabulü kapandı: 56 test + GLB validator + gerçek Chromium (1971754eb0de3d3b37697a28b84f85d4e5615f45). Fiziksel Android ve yayın bağımlılıkları açık; sonraki iş yalnız Raund 5. Doğrulama envanteri HANDOFF.md'dedir.
