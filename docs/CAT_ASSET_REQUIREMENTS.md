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

Güncel geometri sürüm 3; görsel kabul açık. Kaynak `scripts/build-cat.mjs` ve `scripts/cat-geometry.mjs`; boyut, üçgen, kemik, klip ve materyal hash'lerinin tek kaynağı `public/models/asset-manifest.json`. Model + albedo ≤5 MiB, temel yüzey ≤28 bin ve toplam ≤50 bin üçgen bütçesi validator tarafından kontrol edilir. Bu bütçeler fiziksel Android kabulü yerine geçmez.

- Gövde/yanak/patiler yumuşak SDF birleşimidir. MarchingCubes kenar hücrelerine pay bırakılır; exported beyaz kaplamanın açık kenarı olmadığı doğrulanır. Kısa tüyler yüzeyle aynı skin ağırlıklarını kullanır.
- İris ve pupil tek pürüzsüz yüzeydedir; göz çevresindeki kalın halkalar kaldırılmıştır. Albedo ve bump aynı beyaz kürk kaynağını kullanır. Materyal kaynak/prompt'u `assets/cat/` içinde; özgün geometri/rig ve materyal lisansı `public/models/LICENSE.txt`.
- Tüylerin iki yüzü kaplamanın dışa bakan normalini kullanır; ters normalden doğan siyah/aydınlık benekler engellenir. Fiziksel materyal ana/doldurma/kenar ışıklarını kullanır. Coat self-shadow kapalıdır; oda zemini gölgeyi alır. VSM gölgesi, temas gölgesi ve yerel oda yansıması kullanılır. Three.js lisansı `public/THIRD_PARTY_NOTICES.txt`.
- Kamera [0.08,1.16,3.1], hedef [0,0.67,0], FOV 34°, y açısı -0.22 rad; modelin zeminden y ofseti 0.02. İsim/tercihler ve mevcut altı klip korunur. Care oyun ve kutlamadan önceliklidir; beden boyutu kaloriyle değişmez.
- DPR≤1.5, 1024² gölge; düşük FPS önce DPR≤1/gölgesiz/yarım tüy, sonra statik görünüm. Gizli sekme/kart durur. Model/albedo 404, 12s timeout, WebGL yokluğu veya context kaybında kayıt formu kullanılabilir.

Statik `public/models/cat-poster.png`, son GLB+materyalin gerçek Chromium render'ıdır; kaynak değişirse build sonrası `node scripts/render-cat-poster.mjs` ile güncellenir. Raporlar `docs/verification/` içindedir. Software Chromium ölçümleri fiziksel Android FPS veya bağlantı ölçümü değildir. Referansın doğal ve yoğun kürk kalitesi tam olarak karşılandı diye raporlanmaz.
