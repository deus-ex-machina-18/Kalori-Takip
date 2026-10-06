# Raund 4 için gerçek 3D kedi varlık şartnamesi

R1'deki inline SVG iki boyutlu taslak. Model, animasyon veya döndürülebilir 3D varlık temin edilmedi. İsim/nihai estetik kullanıcı onayı bekler. Ücretli asset satın alınmadı.

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

## R4 teslim envanteri — 6 Ekim 2026

Kullanıcı üç referanstan 1. yumuşak oyuncak yönünü gri-beyaz seçti. Yeni varlık özgün prosedürel mesh'tir; dış model indirilmedi. Gerçek GLB: `public/models/grey-white-kitten.glb`. Kaynak URL: https://github.com/deus-ex-machina-18/Kalori-Takip/blob/main/scripts/build-cat.mjs. Yazar: Kalori-Takip proje katkıcıları. Sürüm 1; dış indirme tarihi uygulanmaz, üretim tarihi 2026-10-06. MIT lisans tam metni `public/models/LICENSE.txt`; ticari kullanım, değiştirme ve dosya dağıtımı lisansla izinlidir, metin varlıklarla taşınmalıdır. Hash, byte/üçgen sayısı ve validator raporu `public/models/asset-manifest.json` tek kaynaktır.

- GLB: 996.320 bayt, 19.936 üçgen, 0 texture. Malzemeye göre birleştirilmiş 8 draw group. Oda geometri maliyeti küçük; kedi+oda toplamı 50 bin üçgen bütçesinin altında, renderer sayaçları tarayıcı kabulünde ayrıca kaydedilir.
- Metre, Y-up, ön +Z; zemin pivot [0,0,0]. Kamera konumu [0.08,1.01,2.95], hedef [0,0.76,0], FOV 34°; kedi başlangıç y açısı -0.22 rad.
- Skin: Root, Body, Head, EarL, EarR, TailBase, TailTip, PawL, PawR, HindL, HindR, EyeL, EyeR, Mouth. Parçalar joint ağırlıklarıyla riglidir. Göz kapama EyeL/EyeR ölçeğiyle; yüz çizgileri Mouth kemiğine bağlıdır. Yüksek ayrıntılı kürk veya facial capture sistemi yok.
- Klipler: idle 4s loop, happy 2s one-shot, stretch 3s one-shot, play 2.4s one-shot, sleep 6s loop, care 4s loop. 0.25s geçiş; one-shot bitince idle/care, uyku kullanıcı düğmesiyle seçilir. Care tüm happy/play/stretch tetiklerini bastırır. Reduced motion'da hiçbir animasyon döngüsü oynatılmaz.
- Ses dosyası veya yeni lisanslı ses yok; varsayılan kapalı.
- Sahne teknik hedefleri: dinamik yükleme, DPR ≤1.5, ~30 FPS, görünmezken durma; görünür 4s örnekte <20 FPS statik yedeğe geçiş. WebGL yok/404/12s timeout/context kaybı aynı yedek yolunu kullanır. Statik görüntü gerçek GLB yerine geçmez.

Fiziksel orta sınıf Android cihazda ≥30 FPS ve <3 sn ilk sahne kabulü henüz ölçülmedi. GitHub Chromium SwiftShader yazılım renderer akış doğrulaması, fiziksel cihaz kabulü değildir. Modelin referans yönünü izlemesi otomatik birebir kürk/detay eşitliği anlamına gelmez.

Gerçek modelin nötr kamera görüntüsü `public/models/cat-poster.png` olarak saklanır; son modelin Chromium render'ından alınmıştır. Statik modda ve sahne hatasında aynı görüntü gösterilir. SVG erken teknik yedek çizimi olarak kalır; aktif UI PNG kullanır. Gölge 512² tek map; son Chromium sayaçları gölge geçişi dahil 40.580 çizilen üçgen ve 22 draw call verdi. Yerel preview yükleme ölçümü 222 ms; ağ/Android ilk yükleme sonucu değildir.
