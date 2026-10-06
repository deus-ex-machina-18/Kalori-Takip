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

Görsel kalite kabulü açık; bu dal referans seviyesinde tamamlanmış teslim değildir. Kaynak: `scripts/build-cat.mjs` + `cat-geometry.mjs`. Özgün geometri/rig/klip, MIT lisansı `public/models/LICENSE.txt`. Imagegen beyaz kürk albedosunun kaynak/prompt'u `assets/cat/` içinde. Three.js RoomEnvironment MIT lisansı `public/THIRD_PARTY_NOTICES.txt` içinde. Stock kedi indirilmedi veya satın alınmadı; araştırma `CAT_ASSET_RESEARCH.md`.

- GLB sürüm 2: 4.325.772 bayt; 27.300 temel yüzey + 22.500 kısa tüy = 49.800 gerçek üçgen. 14 kemik, altı klip korunur. Model + 1024px JPEG albedo toplam 4.702.994 bayt. Revizyon bütçesi temel yüzey ≤28 bin, toplam ≤50 bin, ilk model+albedo ≤5 MiB. İlk bütçenin artışı fiziksel Android performans kabulü yerine geçmez.
- GLB içindeki texture sayısı 0; UV'ler sahne tarafından uygulanan albedo/bump için korunur. Validator sıfır hata/uyarı, 12 UNUSED_OBJECT bilgilendirmesi (UV). Hash ve dosya boyutları manifest'te doğrulanır.
- Yüz/gövde SDF yumuşak birleşiminden örneklenir; tüyler yüzey alanına göre deterministik yerleşir ve aynı skin ağırlıklarıyla hareket eder. Renkler/skin ağırlıkları normalized byte; hareket hesapları veya kedinin beden boyutu kalori girişine göre değişmez.
- Kamera [0.08,1.22,3.15], hedef [0,0.71,0], FOV 34°, kedi y açısı -0.22 rad. Tek oda; çevre yansıması, oda yüzey dokuları, sıcak ana ışık, doldurma/kenar ışığı, temas gölgesi. Tüyler basit tek diffuse shader kullanır; sinematik saç simülasyonu değildir.
- Root, Body, Head, EarL/R, TailBase/Tip, PawL/R, HindL/R, EyeL/R, Mouth. idle 4s, happy 2s, stretch 3s, play 2.4s, sleep 6s, care 4s. 0.25s geçiş, care önceliği ve reduced motion korunur; ses yok.
- DPR≤1.5, tek 1024² dinamik gölge; 4s görünür örnekte <26 FPS olursa DPR≤1/gölgesiz/yarım tüy moduna geçer. Sonraki örnekte <20 FPS ise statik render. Invisible/hidden durma ve tekrar devam; model veya albedo 404, 12s timeout, WebGL/context loss aynı statik yedeği kullanır.
- Yerel Chromium153 SwiftShader tam boy durgun sahne: gölge geçişi dahil 80.222 çizilen üçgen, 32 draw call, 5.623ms yerel ilk yükleme. Bu fiziksel Android veya internet ölçümü değildir. 160px backbuffer animasyon mekaniği kontrolü cihaz FPS kabulü değildir. ≥30 FPS / <3s fiziksel Android hedefi açık.

Statik `public/models/cat-poster.png` aynı son GLB+materyalin gerçek Chromium render'ıdır. Kaynak değişirse build sonrası `node scripts/render-cat-poster.mjs` ile yenilenir. İmaj referansı GLB yerine kullanılmaz. Görsel kalite gerçek render üzerinden kullanıcıyla değerlendirilmelidir.
