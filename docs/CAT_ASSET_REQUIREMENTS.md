# Raund 4 için gerçek 3D kedi varlık şartnamesi

R1'deki inline SVG iki boyutlu taslaktı. R4'te kullanıcı 1. yumuşak oyuncak yönünü gri-beyaz seçti; gerçek mesh/rig/animasyon ve aynı modelin statik render'ı aşağıdaki envanterle teslim edildi. Kedi adı Ayarlar'dan değişir. Ücretli asset satın alınmadı.

## Gereksinimler

- Tek stilize yavru kedi, tek sade oda. GLB/glTF 2.0, metre birimi, Y-up, merkez/pivot ve başlangıç kamera açısı belgeli; model gerçek 3D geometri olmalı.
- Kaynak URL, yazar, lisans metni, indirme tarihi, sürüm/hash. Ticari kullanım, değişiklik ve web üzerinden dosyanın dağıtımı izinleri açık; gerekiyorsa atıf eklenir. Çalınmış/belirsiz asset veya yalnız görsel referans kabul edilmez.
- Rig: iskelet, kafa/kulak/kuyruk/pati hareketleri; göz kapama ve ağız/yüz ifadeleri için kemik veya morph target. Kemik ve klip adları kayıtlı.
- Klipler: idle, happy, stretch, play, sleep, care. Loop/one-shot ve geçiş süresi açık. Model yetersiz tüketimde mutlu kutlama yapmaz; ceza, hastalanma veya şişmanlama animasyonu yok.
- Ses isteğe bağlı; ayrı lisanslı kısa mırlama, varsayılan kapalı. Dokunma ile yatay sürükleme ayrılır. Yatay döndürme ve başlangıç açısına dönme; kayıt girişi sahneden bağımsız.

## Başlangıç performans bütçesi — hedef, henüz ölçülmedi

- Orta sınıf Android, Chrome/WebGL2; kullanıcı cihazında ölçüm gerekir.
- Kedi ≤25 bin üçgen; oda dahil sahne ≤50 bin. En fazla 2 adet 1024² texture atlası; mümkünse KTX2; model+texture ilk yükleme hedefi ≤5 MB. Bunlar gerçek varlık geldiğinde ölçülüp gerekçeyle güncellenir.
- Hedef ≥30 fps etkileşim; ilk anlamlı sahne hedefi <3 sn iyi bağlantıda. DPR sınırı, gölge/ışık azaltma, görünür değilken animasyon durdurma. GLTF validator kontrolü; WebGL context kaybı ve asset 404 testi.
- Statik 2D yedek, hareket azaltma ve düşük performans modu. Canvas yerine erişilebilir metin ve kontrol; yükleme/model hatasında kalori girişi çalışmaya devam eder.
- Teslimde GLB, lisans, klip envanteri, dosya boyutları, cihaz/tarayıcı ve ölçülmüş fps/yükleme sonuçları olmalı. Asset yoksa Raund 4 kısmi/engelli olarak raporlanır.

## R4 görsel revizyon envanteri — 6 Ekim 2026

Güncel geometri sürüm 4; görsel kabul açık. Boyut, hash, üçgen/kemik/klip ve poster envanteri `public/models/asset-manifest.json`; render profili `assets/cat/render-settings.json`. GLB temel yüzey ≤28 bin, toplam ≤50 bin; **GLB + albedo + aktif WebP poster birlikte ≤5 MiB**. Çalışma anında underfur tekrar çizilir: gölge dahil sınır 300 bin üçgen. Bunlar fiziksel Android kabulü yerine geçmez.

- Gövde/yüz/parmaklar SDF yumuşak birleşimidir; kapalı göz yuvaları ve kapalı beyaz kaplama validator'da ayrıca kontrol edilir. Kornea kapak yüzeyi, düzleme yakın iris normalleri, büyük pupil, burun/ağız ve yüzle hizalı kemikler.
- Kulaklar kapalı çanak yüzeyi ve düzgün normalli pembe iç yüzeydir. GLB'deki alan ağırlıklı kısa tüyler aynı skin ağırlıklarını kullanır.
- `src/ui/cat-fur.ts` aynı GLB kaplama buffer'larından underfur üretir; 12 katman tam, 4 katman hafif mod. Kök araması düzensiz komşu hücrelere, bükülme her folikülün sabit hash'ine bağlıdır. Yer değiştirme skinning öncesi uygulanır; iskeletin world transform'u ikinci kez uygulanmaz. Malzemeler shader/program key ile paylaşılır; buffer, materyal ve skeleton dispose edilir.
- Kaplama ve underfur dışa bakan normal, fiziksel ışık ve PCF soft shadow kullanır. Albedo/bump aynı materyalden; kaynak/prompt `assets/cat/` içinde. Özgün geometri/rig/kürk shader'ı MIT; Three.js lisansı `public/THIRD_PARTY_NOTICES.txt`.
- Kamera [0.10,1.16,3.25], hedef [0,0.72,0], FOV 34°, y açısı -0.22 rad, kedi y ofseti 0.02. care oyun/kutlamadan önceliklidir; beden boyutu kaloriyle değişmez.
- DPR≤1.5, 1024² gölge. <26 FPS ilk 4s örnekte DPR≤1, gölgesiz, 4 katman ve yarım kısa tüy; sonraki <20 FPS örnekte statik. Gizli sekme/kart durur. Model/albedo 404, 12s timeout, WebGL yokluğu veya context kaybında kalori formu korunur.
- Statik `public/models/cat-poster.webp` aynı son GLB/ışık/shader'ın Chromium render'ıdır. 600 CSS px sahneden alınan büyük PNG `docs/verification/r4-live-render.png`; WebP yalnız kodlama dönüşümüdür. Eski aktif PNG kaldırıldı. Kaynak değişince build sonrası `node scripts/render-cat-poster.mjs` poster ve manifest'i yeniler; ardından build yenilenir.

Son Chromium raporları `docs/verification/` içindedir. Tam sahne 281.366 çizilen üçgen / 42 draw call; kısa animasyon mekanikleri 160px software backbuffer'da ayrı yeni sahnelerle doğrulanır, uzun software-GPU koşusunda statik fallback beklenebilir. Tam boy yavaş RAF ile 12→4→statik ayrıca doğrulanır. Bunlar fiziksel Android FPS/bağlantı ölçümü veya referansın doğal kürk kalitesinin birebir karşılandığı iddiası değildir.
