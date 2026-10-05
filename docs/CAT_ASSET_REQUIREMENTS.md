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
