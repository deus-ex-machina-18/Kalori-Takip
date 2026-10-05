# Kedi Kalori — proje kararları

Sürüm: 0.2.0 · 5 Ekim 2026 · Raund 2
Repo: https://github.com/deus-ex-machina-18/Kalori-Takip · ana dal: main

## Ürün

Türkçe, telefon öncelikli manuel günlük kalori takibi. Geçici ad **Kedi Kalori**; sıcak krem/adaçayı/şeftali görsel yönü ve düz kedi çizimi taslak, kullanıcı tarafından nihai olarak onaylanmadı. Beş ekran: Bugün, Kayıtlar, Planım, İlerlemem, Ayarlar. Kullanıcı kaloriyi dışarıda hesaplar; uygulama toplamı veya yalnızca kcal parçalarını kabul eder. Besin kataloğu, fotoğraf/barkod/porsiyon hesabı ve LLM yok.

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

Alt navigasyon mobilde sabit, masaüstünde üstte. Yerel sistem fontları, görünür odak, içeriğe geç bağlantısı, semantik başlıklar, en az 48px navigasyon/kontrol yüksekliği. Sayfa değişiminde odak başlığa gider. Hareket azaltma cihaz tercihini başlangıçta okur; ayar bu oturumda değişir. R4 gerçek sahne geldiğinde bu tercih kalıcı CatPreferences'e bağlanacak.

R2 kullanıcı onayıyla profil ve plan üretir; manuel kalori ve kilo kaydını IndexedDB'de tutar. R3–6 kapsamları etiketli kalır. SVG çizim 2D taslaktır; gerçek model değildir. Gerçek Android ve ekran okuyucu testi pilot öncesi gereklidir.

## Değişiklik disiplini

Her raund aynı depoda ilerler. CURRENT_TASK.md güncel sınırı; HANDOFF.md kontrolleri ve sonraki tek işi taşır. Mevcut şema sessizce değiştirilmez; migrasyon gerekir. Geçmiş plan sürümleri değişmez. Bir raundun testleri geçmeden sonraki raund başlamaz. Gizli anahtarlar repoya konmaz.
