# R4 video entegrasyonu — devir

10 Ekim 2026 · `deus-ex-machina-18/Kalori-Takip` · dal `r4-visual-quality` · taslak PR #1.
Başlangıç head: `6b0b9ecf32709626b11269bd44c7e82062e4df28`. Yeni head için GitHub'ı esas al.

## Tamamlanan uygulama

- Eski aktif Three.js kedi, kullanıcının mevcut beş videosunu oynatan sabit açılı kartla değişti. Bekleme yeniden üretilmedi.
- Başarılı bugünkü tamamlama, ilgili tepkiyi bir kez oynatır. Sonra bekleme; sonuç yazısı kayıtlı veriden kalır. Yenileme/navigasyon replay üretmez. Kayıt hata/retry akışı korunur. Tamamlamada kart görünür alana getirilir.
- Aralık/sınır/koruma sonucu enerji motorunun farklarından sunulur; hesap motorları, veri tipleri ve IndexedDB v1 değişmedi. Care önceliği korunur.
- İsim/statik/hareket azaltma mevcut ayarlarda kalıcı. Kare medya contain; video gizliyken durur; hata poster/form yedeğine döner. İki video elemanı en fazla aynı anda; tepki dosyaları yalnız olayda yüklenir.
- Beş MP4: 640×640, Baseline/yuv420p, sessiz, fast-start, 24 fps. Orijinal 16 fps kaynaklara yeni hareket karesi uydurulmadı. 0,25 sn ortak başlangıç karesine çözünür. Aktif poster aynı idle ilk karesidir.
- Paket+poster 1.539.538 bayt; ilk yük 312.844 bayt. Bir 640px RGBA kare ~1,64 MB, iki kare ~3,28 MB: bu yalnız ham kare hesabıdır, gerçek decoder bellek ölçümü değildir.
- Oyun/esneme/uyku klipleri mevcut değil; eski 3D hareket/döndürme kontrolleri aktif karttan kaldırıldı. Kaynak 3D çalışma `docs/archive/r4-3d-handoff.md` ve mevcut dosyalarda korunur.

## Dosyalar

`src/ui/cat-card.ts`, `cat-video.ts`, `cat-result.ts`; `src/ui/tracker.ts` başarılı kayıt olayı; `src/main.ts`, ilgili CSS. Aktif medya/provenance/hash tek kaynak `public/cat-media/asset-manifest.json`. `scripts/prepare-cat-videos.py`, `validate-cat-media.mjs`, `cat-browser-check.mjs`, mevcut `browser-check.mjs`; `tests/cat-result.test.ts`.

## Doğrulama

- Beş MP4 yerelde FFmpeg ile sonuna kadar hatasız çözüldü.
- Yerel Chromium indirimi geçerli ZIP dönmedi; gerçek tarayıcı kabulü GitHub Actions'ta çalıştırılır.
- Güncel `npm run check` ve Chromium sonucu/kanıtı aşağıya işlenecek. Eski 56 testi yeni video kabulü sayma.

## Açık

Hedef-altı videoda kap klip ortasında belirip kayıyor; son kare çözünmesi bunu tamamen düzeltmez. Hedef üstü hafif uyarıda yan bakış/baş sallama zayıf. Fiziksel Android yükleme/pil/decode ve kullanıcı görsel kabulü açık. Yeni kedi/video üretilmedi; ücretli servis kullanılmadı. Main'e birleştirme/yayın yok.

## Sonraki tek görev

Önce aynı sürümü gerçek Android'de kontrol et. Sonra sorunlu klipleri/alternatifleri aynı ilk kare/kamera/ışıkla üret. R5 bildirim/ödül veya hesap değişikliği ekleme.
