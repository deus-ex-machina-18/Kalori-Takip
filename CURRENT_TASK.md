# Güncel görev — Raund 4

Tek çıktı: kullanıcı tarafından seçilen 1. örneğin gri-beyaz yönünde gerçek rigli 3D kedi ve sade oda sahnesi. Kullanıcı mevcut görseli yetersiz buldu; Raund 4 görsel kalite revizyonu sürüyor. R5'e geçilmedi.

## Sınır

`src/ui/cat-card.ts`, `cat-scene.ts`, mevcut `main.ts`/`styles.css`; `src/domain/cat.ts`, mevcut CatPreferences sözleşmesi ve IndexedDB v1 store'u; `public/models/`, tekrar üretilebilir `scripts/build-cat.mjs`, asset/test/browser kontrolü ve devir belgeleri.

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
- R2/R3 regresyonları, DOM ve gerçek Chromium akış/genişlik kabulü. Yazılım WebGL testi gerçek Android performansı sayılmaz.

Durum: görsel kalite kabulü açık; uygulama teknik kontrolleri referans kalitesine ulaşmak anlamına gelmez. `r4-visual-quality` dalı bağlantı kesintisi sonrası yeniden oluşturulan kaynakları ve materyali korur. Gerçek render incelenmeden ve kullanıcı görseli kabul etmeden tamamlandı denmez. Fiziksel Android performansı ve yayın açık.
