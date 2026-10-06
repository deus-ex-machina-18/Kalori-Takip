# Güncel görev — Raund 4

Tek çıktı: kullanıcı tarafından seçilen 1. örneğin gri-beyaz yönünde gerçek rigli 3D kedi ve sade oda sahnesi. Kullanıcı mevcut görseli yetersiz buldu; Raund 4 görsel kalite revizyonu sürüyor. R5'e geçilmedi.

## Sınır

Bu revizyon: `src/ui/cat-card.ts`, `cat-scene.ts`, yeni `cat-fur.ts`; `assets/cat/render-settings.json`; `scripts/cat-geometry.mjs`, `build-cat.mjs`, poster/validator/browser kontrolü; `public/models/`, `docs/verification/` ve devir belgeleri. Kalori ve veri katmanlarında değişiklik yok.

Kalori, hareket, plan ve haftalık hesap motorları; beş ekran; framework ve veri şeması sürümü korunur. R5 ödül/bildirim ve R6 export/silme/hosting eklenmez. Ses isteğe bağlı kapsamdır; lisanslı ses üretilmediği için kapalı kalır.

## Seçim

Üç ayrı örnek sunuldu. Kullanıcı: “1 hocam ama rengi gri-beyaz olsun.” Seçilen yön yumuşak oyuncak görünümü; nihai varlık gerçek GLB'dir, referans PNG değil. Görünüm için yeniden seçim gerekmiyor.

## Kabul

- GLB/glTF 2.0, gerçek geometri ve skin; baş/kulak/kuyruk/pati/göz/yüz kemikleri; idle/happy/stretch/play/sleep/care klipleri.
- GLTF validator sıfır hata/uyarı; revizyon bütçesi ≤28 bin temel yüzey + 22.500 kısa tüy üçgeni, toplam ≤50 bin; model + albedo ≤5 MiB. Kaynak, prompt, lisans, hash ve klip envanteri. Bütçenin önceki 25 binden artması gerçek Android performans kabulü yerine geçmez.
- Dokunma/yatay sürükleme/dikey scroll ayrımı, klavyeyle döndürme ve başlangıç açısına dönüş.
- Enerji motorunun mevcut catState'i kullanılır; düşük tüketimde care kutlamayı/oyunu bastırır; beden boyutu kalorilerle değişmez.
- İsim, hareket azaltma ve statik mod native IndexedDB'de; atomik makbuz/retry ve snapshot CAS.
- Asset 404, WebGL context kaybı, WebGL yokluğu ve düşük FPS'te statik yedek; kalori formu sahneden bağımsız çalışır.
- Görünmez sekme/kartta animasyon durur; DPR ≤1.5, 30 FPS hedefli döngü; fiziksel Android ölçümü ayrı açık gereksinimdir.
- Underfur aynı GLB vertex/skin buffer'larını kullanır. Tam 12, hafif mod 4 katman; shadow dahil çalışma anı bütçesi 300 bin çizilen üçgen. Bu revizyonun GPU yük artışı fiziksel Android ölçümü gerektirir. GLB + albedo + aktif WebP poster birlikte ≤5 MiB.
- R2/R3 regresyonları, DOM ve gerçek Chromium akış/genişlik kabulü. Yazılım WebGL testi gerçek Android performansı sayılmaz.

Durum: sürüm 4; göz yuvaları/iris, çanak kulak, ağız/kemik pivotları, parmaklar ve 12 katmanlı kürk geliştirildi. 56 test, GLB/kapalı yüzey/hash bütçeleri ve gerçek Chromium kabulü geçti. Görsel kalite kabulü açık; teknik testler referans kalitesine ulaşmak anlamına gelmez. Son görüntü `docs/verification/r4-live-render.png`. Fiziksel Android performansı ve yayın açık.
