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

## Kabul

Yerel TypeScript, build, 39 domain/depo + 22 DOM = 61 test ve dokuz medya doğrulaması başarılı. Yeni dört MP4 tam FFmpeg çözümü başarılı. Gerçek tarayıcı kontrolü ve canlı yayın doğrulaması yürütülüyor; henüz tamamlandı iddiası yok.

Tarayıcı kontrolü: dört gerçek decode/ended/idle, tek seçilen medya, kalori tepkisi önceliği, veri yazmama, klavye, gizliyken durma, navigasyon/reload replay yok, yeni klip 404 yedeği, statik/hareket azaltma ve önceki kalori/depo regresyonları.

Sonraki tek iş: tarayıcı kontrolünü tamamla, ana dala taşı ve mevcut Netlify sitesindeki yeni klip/kodları doğrula. Fiziksel Android kabulü açık.
