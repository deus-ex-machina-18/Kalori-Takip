# Güncel görev — Raund 4

Tek çıktı: mevcut gri-beyaz gerçek rigli 3D kedinin doğal kısa kürk ve sıcak oda ışığı farkını azaltan bir görsel revizyon, güncel statik WebP ve gerçek 390px uygulama görüntüsü. Başlangıç uygulaması `e5e35c3821cf55965743ae8a20cf824785db5d7a`, dal `r4-visual-quality`, taslak PR #1. R5'e geçilmedi. Güncel PR head'ini esas al; main'den bu işi sürdürme.

İlk inceleme: `docs/verification/r4-target-reference.png`, `r4-live-render.png` ve `r4-mobile-390.png` görüntülerini aç. En büyük 2–3 farkı belirle; aynı sorunu çözmeyen özellik ekleme. Hedef resimdeki turuncu renk yerine seçilmiş gri-beyaz korunur. Devir, dosya haritası, ölçüm sınırları ve tekrar üretim sırası `HANDOFF.md` içinde.

## Sınır

Bu revizyon: `src/ui/cat-card.ts`, `cat-scene.ts`, yeni `cat-fur.ts`; `assets/cat/render-settings.json`; `scripts/cat-geometry.mjs`, `build-cat.mjs`, poster/validator/browser kontrolü; `public/models/`, `docs/verification/` ve devir belgeleri. Kalori ve veri katmanlarında değişiklik yok.

Kalori, hareket, plan ve haftalık hesap motorları; beş ekran; framework ve veri şeması sürümü korunur. R5 ödül/bildirim ve R6 export/silme/hosting eklenmez. Ses isteğe bağlı kapsamdır; lisanslı ses üretilmediği için kapalı kalır.

## Seçim

Üç ayrı örnek sunuldu. Kullanıcı: “1 hocam ama rengi gri-beyaz olsun.” Seçilen yön yumuşak oyuncak görünümü; nihai varlık gerçek GLB'dir, referans PNG değil. Görünüm için yeniden seçim gerekmiyor.

## Kabul

- GLB/glTF 2.0, gerçek geometri ve skin; baş/kulak/kuyruk/pati/göz/yüz kemikleri; idle/happy/stretch/play/sleep/care klipleri.
- GLTF validator sıfır hata/uyarı; revizyon bütçesi ≤28 bin temel yüzey + 22.500 kısa tüy üçgeni, toplam ≤50 bin; model + albedo + aktif WebP poster birlikte ≤5 MiB. Kaynak, prompt, lisans, hash ve klip envanteri. Bütçenin önceki 25 binden artması gerçek Android performans kabulü yerine geçmez.
- Dokunma/yatay sürükleme/dikey scroll ayrımı, klavyeyle döndürme ve başlangıç açısına dönüş.
- Enerji motorunun mevcut catState'i kullanılır; düşük tüketimde care kutlamayı/oyunu bastırır; beden boyutu kalorilerle değişmez.
- İsim, hareket azaltma ve statik mod native IndexedDB'de; atomik makbuz/retry ve snapshot CAS.
- Asset 404, WebGL context kaybı, WebGL yokluğu ve düşük FPS'te statik yedek; kalori formu sahneden bağımsız çalışır.
- Görünmez sekme/kartta animasyon durur; DPR ≤1.5, 30 FPS hedefli döngü; fiziksel Android ölçümü ayrı açık gereksinimdir.
- Underfur aynı GLB vertex/skin buffer'larını kullanır. Tam 12, hafif mod 4 katman; shadow dahil çalışma anı bütçesi 300 bin çizilen üçgen. Bu revizyonun GPU yük artışı fiziksel Android ölçümü gerektirir. GLB + albedo + aktif WebP poster birlikte ≤5 MiB.
- R2/R3 regresyonları, DOM ve gerçek Chromium akış/genişlik kabulü. Yazılım WebGL testi gerçek Android performansı sayılmaz.

Durum: sürüm 4; göz yuvaları/iris, çanak kulak, ağız/kemik pivotları, parmaklar ve 12 katmanlı kürk geliştirildi. 56 test, GLB/kapalı yüzey/hash bütçeleri ve gerçek Chromium kabulü geçti. Görsel kalite kabulü açık; teknik testler referans kalitesine ulaşmak anlamına gelmez. Son görüntü `docs/verification/r4-live-render.png`. Fiziksel Android performansı ölçülmedi; bu ölçüm ayrı açık gereksinimdir. Bu turda birleştirme/yayın yok.
