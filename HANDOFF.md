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
- `npm run check`: TypeScript/üretim build + 39 domain/depo/sınır + 20 DOM = **59 test**, medya hash/bütçe/fast-start geçti.
- Gerçek Chromium: **başarılı** [Actions 38084061717](https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/38084061717), test edilen uygulama commit'i `4ccad767dfa40fdc0e897aa776438fc2d6d974f6`. Native IndexedDB/R2/R3 ve tercihler/retry, sekiz kcal/sınır sonucu, kısmi 800, gerçek video decode/ended/idle, sabit yazı, reload/navigasyon replay yok, başarılı completion retry, IntersectionObserver pause/resume, simüle görünmez sekme, beş genişlik contain, statik/hareket azaltma MP4 yok, idle/tepki 404 ve autoplay reddinde çalışan form. `errors=[]`.
- Artifact 11681885098: 75 dosya. Kalıcı kanıt `docs/verification/r4-video-browser-report.json`, `r4-video-metrics.json`, `r4-video-mobile-390.png`. Kartın görsel kesiti `r4-video-cat-card-390.png`. Tam ekran görüntüsünde klavye testinden kalan odaklı “İçeriğe geç” bağlantısı görünür; kesit yalnız kartın görsel incelemesidir.
- 390px ekranda medya kartı 304×304 CSS px; kaynak gerçekten 640×640 çözülür, object-fit contain. 320/360/768/1280 genişliklerde de taşma yok. Bunlar masaüstü Chromium'da mobil viewport sonuçlarıdır; fiziksel Android sonucu değildir.
- Sonraki belge/kanıt commit'i aynı uygulama ağacını korur; yeni head'de CI sonucu ayrıca kontrol edilir.

## Açık

Hedef-altı videoda kap klip ortasında belirip kayıyor; son kare çözünmesi bunu tamamen düzeltmez. Hedef üstü hafif uyarıda yan bakış/baş sallama zayıf. Fiziksel Android yükleme/pil/decode ve kullanıcı görsel kabulü açık. Yeni kedi/video üretilmedi; ücretli servis kullanılmadı. Main'e birleştirme/yayın yok.

## Sonraki tek görev

Son kullanıcı yönlendirmesi: kedi adı **Zilli**; varsayılan ad güncellendi. Eski ekranlarda Duman test adı görünebilir. Kullanıcı ayrı sohbette mobil ekran tasarımını çalışacak; önce mevcut video kartını ve uzun sonuçları kullanan 390px Bugün tasarımı, sonra aynı dilde diğer dört ekran. Çalışan hesap/depo/video davranışını veya karakter kimliğini yeniden tasarlama. Yeni özellik, video üretimi ve R5 bu tura eklenmez.

Tasarım uygulandıktan sonra aynı sürümü gerçek Android'de kontrol et. Sonra sorunlu klipleri/alternatifleri aynı ilk kare/kamera/ışıkla üret. Bildirim/ödül veya hesap değişikliği ekleme.
