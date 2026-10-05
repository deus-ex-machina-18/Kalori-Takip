# Raund 1 — devir teslim

Repo: https://github.com/deus-ex-machina-18/Kalori-Takip
Dal: main · sürüm 0.1.0 · 5 Ekim 2026
Kod commit'i: 7197e4b4fcd6b979dfbcdb6d91b0b80414f70bc2
Doğrulanmış kod: https://github.com/deus-ex-machina-18/Kalori-Takip/commit/7197e4b4fcd6b979dfbcdb6d91b0b80414f70bc2
Bu belgeyi güncelleyen sonraki commit yalnız devir teslimi kaydeder; kod aynı kalır.
Başlangıç: boş depo; AGENTS.md veya önceki uygulama yok. İlk depo commit'i b5363a2f3e8cac7bfe699f4332eb8f3bf91eccfb.

## Durum

**Raund 1 kodu hazır; gerçek tarayıcı/mobil görsel kabul kontrolü ortam engeli nedeniyle açık.** Raund 2 başlamadan bu kontrol yapılmalı. Herkese açık yayın yapılmadı; repo kullanıcı tarafından public oluşturulmuş.

## Teslim edilenler

- TypeScript + Vite mobil web iskeleti; beş ekran, hash navigasyonu, görünür odak, içeriğe geç bağlantısı, oturum içi hareket azaltma.
- Dürüst boş durumlar: kalori/plan/kilo/ilerleme verisi yok; boş gün sıfır değil. Gelecek işlem düğmeleri etiketli ve kapalı.
- Açıkça 2D olan taslak kedi; gerçek model gereksinim ve lisans şartnamesi.
- V1 profil/plan/gün/hareket/kilo/kedi/ödül/bildirim tipleri; yerel tarih yardımcıları; repository, PlanEngine ve CatScene arayüzleri.
- PROJECT/CURRENT_TASK ve veri/enerji/3D belgeleri. Güncel enerji kaynakları doğrulandı; kişisel hedef üretilmedi.

## Kontroller

- `npm ci`: başarılı. Node 24.19.0 / npm 11.9.0.
- `npm run check`: TypeScript + üretim build + 3 yerel tarih testi + 5 DOM testinin tamamı başarılı.
- Tarihler: İstanbul gece yarısı, artık gün, geçersiz tarih, New York yaz saati ve geçersiz zone.
- DOM: beş ekran linki, active nav, başlık odağı, boş gün/plan, yanlış rota dönüşü, hareket tercihi, içeriğe geç bağlantısı. Bunlar jsdom kontrolleridir; layout/gerçek dokunma testi değildir.
- `npm run dev`: Vite yerel 127.0.0.1:5173 adresinde başlatma mesajı verdi. Ortam loopback bağlantısını engellediği için HTTP sayfa erişimi doğrulanamadı.
- Varsayılan `0.0.0.0` dev başlangıcı ortamın networkInterfaces kısıtına takıldı; varsayılan 127.0.0.1 yapıldı, ağ erişimi için `npm run dev:lan` ayrıldı. Gerçek kullanıcı ortamında LAN komutu denenmeli.
- agent-browser: daemon socket bind **Operation not permitted**; Chrome kurulumu TLS UnknownIssuer hatası. Gerçek tarayıcı screenshot, 320/360/390px taşma, klavye ve dokunma kontrolü yapılmış sayılmıyor. Başka bir makinede tamamlanmalı.
- Lint ayrı yapılandırılmadı; typecheck mevcut. Gerçek Android ve ekran okuyucu testleri henüz yapılmadı.

## Çalıştırma

```bash
npm ci
npm run check
npm run dev
```

Yerel adres: http://127.0.0.1:5173/#/bugun
Telefon: `npm run dev:lan`, aynı ağda bilgisayarın IP'si:5173.
Üretim: `npm run build`; çıktı dist. Yerel üretim önizleme: `npm run preview`.

## Açık bağımlılıklar

1. Gerçek tarayıcıda 320/360/390/768/1280px beş ekran: yatay taşma yok; alt menü içeriği örtmüyor; 200% zoom, Tab/Enter, geri/ileri ve reduced-motion kontrolü. Kod bunu hedefler; test edilmiş iddiası yok.
2. Kimlik/depolama henüz kurulmadı. R2 tek cihaz IndexedDB pilotu; gerçek güvenli çok kullanıcı/senkronizasyon tamamlanmış sayılamaz. Davetli bulut pilotu ayrı sunucu kimlik/yetki bağımlılığı.
3. Hosting/domain bağlantısı yok. Manifest tam PWA/offline/push değildir. Yayın bu raundun kapsamı dışı.
4. Nihai isim/kedi estetiği, lisanslı GLB ve Android cihaz ölçümü yok.
5. Klinik güvenlik incelemesi yapılmadı. Ürün sınırları kaynak rehberlerin tüm kişilere aynı reçetesi değildir; tam NICE sayfası yayın öncesi yeniden kontrol edilmeli.

## Sonraki tek görev — Raund 2

Önce yukarıdaki açık görsel kabul kontrolünü tamamla; sorun varsa yalnız iskeleti düzelt. Ardından PROJECT.md, CURRENT_TASK.md, docs/DATA_CONTRACT.md ve docs/ENERGY_POLICY.md üzerinden profil + başlangıç planı + manuel kalori + tamamlama/geçmiş düzenleme + kilo + **kalıcı IndexedDB** akışını uygula. Framework'ü/ekranları yeniden başlatma. Cihaz kapsamını açık tut. 650+800+500, 2700/2200/2400, mod değişimi, yenileme, tekrar deneme, yerel gece yarısı ve geçmiş plan testleri zorunlu. R3–6 özellikleri ekleme.
