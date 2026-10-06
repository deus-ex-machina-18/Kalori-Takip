# Raund 4 — devir teslim

Repo: https://github.com/deus-ex-machina-18/Kalori-Takip
Dal: main · sürüm 0.4.0 · 6 Ekim 2026
Başlangıç: R3 teslim ef2df0b65ab10372e5dc89cb259439aa08389cb0.

## Durum

R4 uygulandı; yerel TypeScript, üretim build'i, 56 test ve GLB doğrulaması geçti. **Gerçek Chromium kabulü henüz kapanmadı.** Yayın yapılmadı.

## Seçim ve uygulama

Kullanıcı üç ayrı örnekten “1 hocam ama rengi gri-beyaz olsun” dedi. Yumuşak oyuncak yönünde özgün gerçek 3D mesh/skin üretildi; referans görüntü GLB olarak sunulmadı. Baş/kulak/kuyruk/pati/göz/yüz kemikleri; idle/happy/stretch/play/sleep/care klipleri; tek sade oda.

Gerçek asset `public/models/grey-white-kitten.glb`, kaynak `scripts/build-cat.mjs`, manifest/hash/lisans aynı dizinde. MIT, özgün prosedürel eser; dış mesh/doku/ses yok. 23.024 üçgen, 14 kemik, 932.840 bayt; validator sıfır hata/uyarı. Oda ek küçük geometrilerle oluşturulur. Kaynak çalıştırılınca asset ve manifest yeniden üretilir.

Three.js sahnesi dinamik yüklenir. Yatay sürükleme/dokunma/dikey scroll ayrımı, erişilebilir döndürme/sıfırlama/oyun/gerinme/uyku düğmeleri; geçişler 0,25 sn. Care kutlamayı/oyunu bastırır; kedi gövdesi kalorilere göre değişmez. Kalori/plan/hareket/hafta hesap kodları yeniden yazılmadı.

Kedi adı, reducedMotion, sceneMode mevcut IndexedDB v1 CatPreferences store'unda; profil zorunlu, makbuz+ayar atomik, aynı işlem retry, tam snapshot CAS. Şema yükseltilmedi. Ses varsayılan kapalı ve ses dosyası yok.

3D model 404/timeout/context-loss/WebGL yokluğu/düşük FPS: statik yedek; kalori formu çalışmayı sürdürür. DPR≤1.5, yaklaşık 30 FPS döngü; görünmez sekme veya kartta animasyon durur. <20 FPS ölçümü statik yedeğe geçirir. Gerçek Android ölçümü yapılmadı.

## Kontroller

Yerel: `npm run check` → TypeScript + build + 36 domain/depo + 20 DOM test ve gerçek GLB validator/bütçe kontrolü başarılı. R2/R3 regresyonları, preference CAS/reload/retry, HTML isim güvenliği ve care önceliği kontrol edildi.

Yerel Chromium indirmesi ağ ortamında geçerli ZIP dönmedi. GitHub Actions tarayıcı betiği R4 skin/klip/döndürme/drag/reset/play/stretch/sleep/care, native ayar retry/reload, 404/context kaybı/WebGL yokluğu/statik/reduced motion ve beş genişlikle genişletildi. Chromium SwiftShader yazılım WebGL2 kullanır; sonuç henüz incelenmedi. Sonuç gelmeden gerçek tarayıcı kabulü veya estetik kontrol tamamlanmış sayılmaz.

## Sonraki tek görev

Önce R4 Chromium koşusunu ve `browser-check` artifact'ındaki gerçek model görüntülerini incele; hata varsa düzelt ve tekrar doğrula. Sonra bu deviri doğrulanmış commit/koşu ile kapat. R5'e erken geçme.

Fiziksel Android FPS/yükleme, gerçek %200 zoom, ekran okuyucu ve klinik inceleme pilot öncesi açık. Hosting/login/senkronizasyon/yedekleme yok. R5 kalıcı hafta geri bildirimi/ödüller/bildirim ve R6 veri/yayın işlemleri eklenmedi.

Yeni görsel/3D yön değişikliğinde önce üç örnek şartı korunur; seçilmiş gri-beyaz 1. yön için kullanıcı yetkisi mevcut.
