# Güncel görev — yeni Zilli videoları

12 Ekim 2026 · taban `3e6e859` · dal `zilli-new-reactions`.

Tek çıktı: gönderilen altı MP4’ün mevcut doğru tetikleyicilerde oynatılması.

Kapsam: altı yeni/değişen MP4, medya manifesti, `src/ui/cat-media.ts`, `cat-video.ts` medya seçimi, hazırlama/doğrulama betikleri ve ilgili seçici/Chromium kontrolleri. Bekleme, poster, diğer hareketler, arayüz, hesaplama, kullanıcı kayıtları ve sosyal dal değişmez.

Eşleme: `tmp6hhgftdk (1).mp4` → Uyuklama; `tmpfyzysr6e (1).mp4` → hedef tuttu (kapalı ağızla takdir); `06-planin-altinda-duzeltme.mp4` → planın altında (eski mama kaplı klibin yerine); `07-hedef-asildi-alternatif.mp4` → hedef üstünde, koruma altında. Koruma üstündeki dur-pati klibi korunur.

Kabul: altı klip 640×640 sessiz Baseline/yuv420p ve fast-start; ortak bekleme karesine dönüş; manifest hash ve tam decode; mevcut test/build ve gerçek Chromium oynatma; Netlify canlı dosya hash eşitliği. Sonuç videoları başarılı gün tamamlamada bir kez, Uyuklama düğmesi tıklamada oynar; bitince bekleme. İlk yük aynı kalır.

Doğrulandı: 69 test, TypeScript/üretim build, 11 medya hash/fast-start denetimi ve altı videonun sonuna kadar FFmpeg decode’u geçti. Toplam medya 3.391.486 bayt; ilk yük 312.844 bayt.

Açık: yerel Chromium indirmesi geçersiz ZIP döndürdü; gerçek tarayıcı kabulü CI üzerinde yapılacak. Kullanıcı 12 Ekim 2026’da altı videonun public GitHub/uygulama yayınına açık izin verdi. Önceki otomatik denetim engeli izinle giderildi. Sonraki tek iş: dalı gönder, Chromium CI kabulünü tamamla ve Netlify canlı hash eşitliğini doğrula.

08/09 eklendi: `70918.mp4` → `above-maintenance-alt.mp4`; `70920.mp4` → `below-target-alt.mp4`. Alternatifler kendi kalori sonucunda oturum içinde sıra ile seçilir; 09 ile 06 ve 08 ile mevcut dur-pati dönüşümlü oynar. Yenileme sayacı sıfırlar; kayıt/plan/hesaplama değişmez. Medya seçimi tek kaynak `src/ui/cat-media.ts`. Hazırlama betiği artık yeni klip adlarını kabul eder ve seçilmeyen alternatifleri envanterde korur. İki seçici testi ve Chromium senaryolarına iki alternatif decode kontrolü eklendi.
