# Raund 4 — görsel kalite revizyonu açık

Repo: https://github.com/deus-ex-machina-18/Kalori-Takip
Dal: r4-visual-quality · sürüm 0.4.0 · 6 Ekim 2026
Main çalışan eski R4 sürümünü korur (467546af37e12bf4ea043d89454829de9574aeec). Yayın yapılmadı; R5'e geçilmedi.

## Kullanıcının kabulü

Üç örnekten 1. yön seçildi: gri-beyaz, yumuşak bebek kedi. Kullanıcı mevcut modelin ucuz göründüğünü ve gönderdiği ince kürklü, büyük kahverengi gözlü referans seviyesini istediğini bildirdi. **Teknik kontroller geçti; referans görsel kalitesi henüz sağlandı diye raporlanmaz. Görsel kabul açık.** Aynı seçilen yönü geliştirmek için yeniden seçim istenmez; yeni görsel/3D yön olursa üç örnek kuralı sürer.

## Bu dalda yeniden kurulan değişiklik

Bağlantı kesintisi sonrası yerel çalışma alanı sıfırlandı; önceki kaydedilmemiş kaynaklar kurtarılamadı. Üretilmiş beyaz kürk materyali Git blob'undan kurtarıldı. Bu daldaki geometri/sahne yeniden yazılıp tekrar test edildi; eski kaydedilmemiş test sonuçları kanıt olarak kullanılmadı.

- Geometri SDF yumuşak birleşimli gövde/yüz, yumuşak renk geçişleri, ayrıntılı iris/sclera/nose, kısa gerçek tüyler. Kaynak `scripts/build-cat.mjs` ve `scripts/cat-geometry.mjs`; stock mesh yok.
- GLB 4.325.772 bayt; 27.300 temel + 22.500 tüy = 49.800 üçgen; 14 kemik ve idle/happy/stretch/play/sleep/care. Model+albedo 4.702.994 bayt. Validator sıfır hata/uyarı; 12 kullanılmayan UV bilgilendirmesi, runtime bu UV'leri kullanır.
- Imagegen kaynak/prompt `assets/cat/`; Sharp yalnız boyut/encoding dönüşümü yapar. JPEG albedo 1024px/377.222 bayt. Bump ve oda yüzeyleri prosedürel. Hash/boyut/klip envanteri manifest'te. Gerçek modelin nötr tarayıcı render'ı aktif statik PNG'dir.
- Three.js RoomEnvironment, yansıma, sıcak ana ışık/doldurma/kenar ışığı, temas gölgesi. Three.js MIT metni `public/THIRD_PARTY_NOTICES.txt`; özgün varlık + üretilen materyal MIT metni `public/models/LICENSE.txt`.
- DPR≤1.5; 4s örnekte <26 FPS önce DPR1/gölgesiz/yarım tüy; sonraki örnekte <20 FPS statik. Gizli sekme/kartta durma. Model/albedo hata ve timeout, WebGL yok veya context kaybında statik yedek; kalori formu bağımsız.
- İsim/tercihler, atomic receipt/CAS/retry, IndexedDB v1 şema ve kalori/aktivite/plan/haftalık motorlar korunur. Care oyun/kutlamadan öncelikli; kedinin gövdesi kalorilerle değişmez. Ücretli hizmet/asset/ses açılmadı.

## Yeni yerel kontroller

- `npm run check`: TypeScript, build, 36 domain/depo + 20 DOM testi, GLB ve model+albedo bütçe/hash/rig kontrolleri geçti.
- Chromium153 SwiftShader: native IDB, R2/R3 akışları, beş genişlik, tam boy gerçek model+albedo stilleri, döndürme/sürükleme/reset ve shader hata kontrolü geçti. `docs/verification/r4-browser-report.json` errors=[].
- play/stretch/sleep ve görünmezken durma/geri dönüş animasyon mekanikleri 160px software backbuffer'da kontrol edildi. Tam boy stiller ve bu mekanik kontrol farklı kontrollerdir; Android FPS kabulü denmez. Yavaş RAF'te tam boy balanced→statik, model/albedo404 ve gerçek WEBGL_lose_context kalori formunu korudu.
- Tam boy yerel sahne sayacı 80.222 üçgen (gölge dahil), 32 draw call, yükleme 5.623ms. Fiziksel Android değil; <3s hedefi karşılandı denmez. Son texture tiling ayarı sonrası gerçek poster ayrıca shader/page hatası olmadan yeniden render edilir. Rapor `docs/verification/` içinde.
- Önceki main teknik kabulü Actions37420124824/commit1971754eb0de3d3b37697a28b84f85d4e5615f45; bu revizyonun CI kabulü değildir. Yeni dal CI sonucu ayrı kontrol edilmeli.

## Çalıştırma

```bash
npm ci
npm run check
npm run dev
# model + albedo tekrar üretim:
npm run assets:cat
# build sonrası gerçek tarayıcı kabulü ve poster:
node scripts/browser-check.mjs
node scripts/render-cat-poster.mjs
```

Yerel farklı Chromium için `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` kullanılabilir. CI Playwright Chromium kurar. Gerçek render `public/models/cat-poster.png`.

## Sonraki tek iş

**R4 referans kalite farkını gerçek render'da kapat ve kullanıcı görsel kabulünü al.** Hazır model araştırması `docs/CAT_ASSET_RESEARCH.md`; incelenen ücretli adayda FBX kürksüz ve ham dosyanın public repo dağıtımı doğrulanmamış. Hiçbiri satın alınmadı/kopyalanmadı. Sırf testler geçti diye R5'e geçilmez.

Fiziksel orta sınıf Android ≥30 FPS / <3s ilk sahne, gerçek %200 zoom, ekran okuyucu ve klinik inceleme pilot öncesi açık. Login/bulut senkronizasyonu/yedekleme/hosting/offline/push yok. R5/R6 kapsamı eklenmedi.
