# Güncel görev — R4 sabit açılı kedi

## Onaylanan karar

6 Ekim 2026, 16:21 İstanbul: kullanıcı “Döndürme şart değil” dedi. Yeni yol **sabit açılı, önceden hazırlanmış görsel ve animasyonlu gri-beyaz kedi**. Gerçek zamanlı GLB/kürk, serbest döndürme, klavye ile döndürme ve açı sıfırlama zorunluluğu kaldırıldı. Eski 3D sürüm hâlen uygulamada; yöntem değişikliği henüz kodlanmadı. Aynı karakter/stil korunur, yeniden üç örnek seçimi gerekmiyor.

Dal `r4-visual-quality`, taslak PR #1. Başlangıç uygulaması `e5e35c3`, önceki devir `c2f8b29`; güncel PR head'ini esas al. Main güncel R4 uygulamasını içermiyor.

## Bu turun tek çıktısı

Hedef kalitesine yakın tek bir gri-beyaz ana kedi görselini mevcut Bugün kartında sabit açılı göstermek; kaliteli statik yedek, varlık envanteri ve 390px gerçek uygulama ekran görüntüsüyle kaydetmek. Önce ana karede kürk/yüz/ışık kalitesini çöz; kapsamlı animasyon paketini bu ilk çıktıya yığma. Sonrasında aynı karakter için idle/happy/stretch/play/sleep/care hareketleri hazırlanır.

İlk inceleme: `docs/verification/r4-target-reference.png` (hedef), `r4-live-render.png` (eski canlı 3D), `r4-mobile-390.png` (eski telefon düzeni). Referansın turuncu rengi yerine seçilmiş gri-beyaz korunur. Ayrıntılı devir ve eski ölçümlerin sınırı `HANDOFF.md` içinde.

## Sınır

Kedi kartı, gösterim adaptörü, ilgili stiller, görsel varlıklar, envanter/doğrulama ve devir belgeleri değişebilir. Mevcut catState/CatPreferences, kalori/aktivite/plan/haftalık motorları, IndexedDB v1, beş ekran ve framework korunur. R5 ödül/bildirim ve R6 export/silme/hosting eklenmez. Bu turda birleştirme/yayın yok.

İsim, hareket azaltma, statik tercih ve atomik kayıt/retry korunur. Kalori formu sahneden bağımsız; care oyun/kutlamadan öncelikli; beden boyutu kalorilerle değişmez. Döndürme/sıfırlama kontrolleri yeni yöntemde kaldırılır.

## Kabul

- Referansa göre kürk/yüz/ışıkta belirgin görsel ilerleme; 390px gerçek kartta temiz, gereksiz kırpılmamış kedi.
- Ana görselin kaynak/prompt/provenance, hash ve boyut envanteri; dosya uygulamayla birlikte dağıtılır. Üretilen görsel gerçek GLB render'ı diye sunulmaz.
- İlk gerekli medya ≤5 MiB; sonraki animasyonlar ihtiyaçta yüklenir. Format, decode belleği ve Android performansı ölçülür.
- Medya hatasında kaliteli statik yedek ve çalışan kalori formu. Tercihler, odak ve beş ekran/genişlik akışı korunur.
- Uygun TypeScript/build/domain/DOM/gerçek Chromium kontrolleri. GLB/12 katman/döndürme varsayımları yeni kabulün yerine geçmez.
- Animasyon aşamasında aynı karakter/kamera/ışık, düzgün döngü/geçiş, care önceliği ve görünmezken durma. Altı durum korunur.

Durum: yöntem değişikliği onaylandı; yeni ana görsel ve gösterim henüz yapılmadı. Eski 3D sürümün 56 testi ve Chromium kontrolü geçmiş kanıttır. Görsel kullanıcı kabulü ve fiziksel Android kabulü açık.
