# Kedi Kalori · Raund 1

Manuel kalori takibi için Türkçe, telefon öncelikli uygulama iskeleti.

## Çalıştırma

Node.js **22.12+** (test edilen: 24.19.0) ve npm gerekir.

```bash
npm ci
npm run dev
```

Tarayıcı: http://localhost:5173/#/bugun
Telefon kontrolü için `npm run dev:lan` başlatılır; aynı Wi-Fi'daki telefonda bilgisayarın yerel IP'si ve 5173 portu ile açılabilir (güvenlik duvarı izin veriyorsa). Bu yerel ağ erişimidir; internete yayın değildir.

```bash
npm run check
npm run build
npm run preview
```

`check`: TypeScript, üretim derlemesi, yerel tarih ve DOM navigasyon testleri. DOM testleri gerçek tarayıcı layout kontrolü değildir. `dist/` statik çıktıdır; hash yolları özel sunucu rewrite istemez. Testlerde Node'un TypeScript type stripping desteği kullanılır.

Gerçek Chromium kontrolü GitHub Actions üzerinden çalışır; başarılı işin `browser-check` artifact'ı ekran görüntüleri ve raporu içerir. Kontrolün eklenmesi başarılı çalıştığı anlamına gelmez; güncel durum `HANDOFF.md` içinde tutulur. Yerelde tarayıcı ve loopback erişimi destekleniyorsa:

```bash
npx playwright install chromium
npm run build
node scripts/browser-check.mjs
```

## Mevcut çıktı

Bugün, Kayıtlar, Planım, İlerlemem ve Ayarlar arasında geçiş; mobil alt menü, klavye odağı ve hareket azaltma ayarı. Ekranlar gerçek kayıt yokken boş durum gösterir. Gelecek işlemler açık raund etiketiyle kapalıdır. Kedi çizimi **2D taslak**; gerçek 3D değildir.

Profil, kayıt, hesap motoru, kalıcı depolama, oturum açma ve yayın henüz yok. Manifest başlangıçtır; offline/PWA kurulum/push tamamlanmadı. Raund 2'de cihazda IndexedDB pilotu uygulanacak; çok kullanıcılı bulut kapsamı ayrı altyapı gerektirir.

## Sonraki sohbet

Önce [PROJECT.md](PROJECT.md), [CURRENT_TASK.md](CURRENT_TASK.md), [HANDOFF.md](HANDOFF.md) ve [veri sözleşmesini](docs/DATA_CONTRACT.md) oku. Sonra yalnız Raund 2'yi uygula. Enerji politikasını `docs/ENERGY_POLICY.md` üzerinden kullan; önceki ekranları/framework'ü yeniden başlatma.
