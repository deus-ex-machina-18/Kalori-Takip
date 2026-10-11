# Güncel görev — dört Zilli videosunu bağlamak

11 Ekim 2026 · `zilli-four-actions` · taban: `3e8766b` (`main`).

Tek çıktı: kullanıcının gönderdiği dört hareketin onaylı görsel dildeki Bugün kartında çalışması.

## Kapsam ve davranış

- Kedi alanına dokunma / klavye aktivasyonu: `touch`; kart altı üç kontrol: `play`, `stretch`, `sleep`.
- Aynı anda tek tepki, sonra mevcut bekleme. Yüklemede/oynatımda/kalori tepkisinde kontroller bekler; tekrar dokunmalar sıraya alınmaz.
- Statik/hareket azaltma ve hata yolu kontrolleri kapatır; kalori formu bağımsız kalır. Hareketler veri yazmaz, sonuç etiketini değiştirmez; yenileme/navigasyon hareketi tekrarlamaz.
- İlk yük ve eski beş klip aynıdır. Yeni klipler ihtiyaca göre yüklenir. Dokuz MP4 + poster toplam 2.862.938 bayt; ilk yük 312.844 bayt. Dört yeni klip 640 kare, 24 fps, sessiz Baseline/yuv420p, fast-start, yaklaşık 3,54 sn.
- Son 0,25 sn ortak idle ilk karesine çözünür. Oyun kuyruk ve esneme son poz farkları nedeniyle bu geçişe ihtiyaç duyar; uyuklama kulakları abartılı kapanır.

Hesap/depo/v1 şema, su/spor kayıtları ve Sosyal altyapı bu görevde değişmez. Yeni video üretilmez.

## Kabul — tamamlandı

- Yerel ve GitHub TypeScript/build, 39 domain/depo + 22 DOM = 61 test, dokuz medya doğrulaması başarılı. Dört yeni MP4 tam FFmpeg çözümü başarılı.
- [Gerçek Chromium kontrolü](https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/38118114893) başarılı; uygulama/test commit'i `7c3c311801d8597a1107153665ff88af6f7dbe6d`, 35 kontrol mesajı, errors=[]. Dört actual decode/end/idle, lazy bir seçilen klip, no interrupt/queue/data writes/replay, klavye, hidden pause, yeni klip 404, kalori tepkisi önceliği, sekiz kalori/sınır durumu, native IndexedDB regresyonları ve beş genişlik kontrol edildi.
- [PR #3](https://github.com/deus-ex-machina-18/Kalori-Takip/pull/3) main'e birleştirildi: `eadefe629dd03a2ba31623ca4661953017ddf304`. İlk CI, önceki arayüz testinin açılır paneli beklemeyen adımında takıldı; test gerçek panel açma akışına uyarlandı, kontroller gevşetilmedi.
- [Canlı uygulama](https://extraordinary-rolypoly-370c36.netlify.app/#/bugun) doğrulandı: `index-D-oZkSEy.js` test edilen yerel build ile bayt düzeyinde aynı. touch/play/stretch/sleep MP4'lerinin dördü video/mp4 HTTP 200 ve manifest SHA256 ile aynı. Mevcut beş MP4/poster değişmedi.
- Kalıcı kanıtlar: `docs/verification/zilli-actions-browser-report.json`, `zilli-actions-metrics.json`, `zilli-actions-live-check.json`, `zilli-actions-card-390.png`. Kart ekranında Duman, ad ayarının kalıcılık testi için kullanıldı; ürün varsayılanı Zilli'dir. Kesit gerçek 390px Chromium ekranından alınmıştır.

Fiziksel Android görsel/oynatma kabulü açık. Masaüstü Chromium mobil viewport ve canlı HTTP doğrulaması, gerçek telefon testi iddiası değildir.

Sonraki tek iş: Android'de dört etkileşimin görsel kabulünü kontrol et. Kalan dokuz klip kullanıcı üretip gönderince ayrı medya turunda incelenecek.
