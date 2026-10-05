# Güncel görev — Raund 1

5 Ekim devam oturumu: tek çıktı, açık mobil kabul kontrolü için Chromium CI altyapısı. `.github/workflows/verify.yml`, `scripts/browser-check.mjs` ve Playwright geliştirme bağımlılığı eklendi. TypeScript/build ve 8 mevcut test geçti. Actions sonucu son kontrolde kuyrukta; gerçek tarayıcı kabulü açık olduğundan Raund 2 başlamadı. Ayrıntı ve kontrol bağlantısı HANDOFF.md'de.

Tek çıktı: belirtilen GitHub deposunda çalışır mobil uygulama iskeleti ve Raund 2 sözleşmeleri.

## Sınırlandırılmış dosyalar

`src/main.ts`, `src/styles.css`, `src/icons.ts`, `src/domain/*`, `public/*`, `index.html`, Vite/TypeScript/npm yapılandırması, `tests/dates.test.ts`, `tests/ui.test.mjs`, `docs/*`, README/PROJECT/CURRENT_TASK/HANDOFF. Başlangıç deposu boştu; yeniden kullanılacak bileşen veya AGENTS.md yoktu.

## Yapılan değişiklikler

Beş ekran ve hash navigasyonu; tokenlar, mobil alt navigasyon, boş kayıt durumları; 2D taslak kedi; yerel gün yardımcı fonksiyonları; ayrık kayıt modu tipleri; repository/hesap/kedi arayüzleri; veri, enerji ve 3D şartnamesi. Tek cihaz yerel pilot veri stratejisi seçildi.

## Dokunulmayanlar

R2 kişisel profil/kalori/kilo yazma, R3 aktivite/plan motoru, R4 gerçek 3D model, R5 ödül/bildirim, R6 pilot yayın. Başka repo/veri yok. Ücretli servis açılmadı, hosting kurulmadı.

## Kabul kriterleri

- npm ci; npm run dev ve npm run build çalışır.
- Beş ekrana gidilir; telefon genişliğinde taşma yok; klavye odak ve içeriğe geç bağlantısı mevcut.
- Hayali kişisel veriler yok; boş gün sıfır değil; sonraki raund özellikleri devre dışı ve etiketli.
- Tarih/şema/plan/kimlik ve hesap sözleşmeleri belgeli; npm run check geçer.
- Gerçek Android, kimlik/hosting/3D eksikleri ve sonraki tek görev HANDOFF'a yazılır.

Durum: kod/dokümanlar ve otomatik kontroller hazır. Gerçek tarayıcı/mobil görsel kabul kontrolü ortam engeli nedeniyle açık; ayrıntılar HANDOFF.md içinde. Sonraki iş yalnız Raund 2.
