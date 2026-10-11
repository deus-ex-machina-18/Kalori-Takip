# Bugün, süreli plan ve spor karşılığı düzeltmeleri

Taban: `309c947bb85224feda871098a715cfe313bcc44a` · 11 Ekim 2026.

## Davranış

- Video alanı artık `:disabled` durumunda opaklığını korur. Oyun ve gün sonucu sırasında düğmenin kilitlenmesi videoyu soluklaştırmaz.
- Video kartı %80 yerine %100 genişlik kullanır; kare kaynak kırpılmaz. Bugün başlığı 23–28 px, kedi adı 17 px. Ayarlar düğmesinde 48 px çerçeve içinde 24 px ikon ortalanır. Tekrarlanan, dikişli kâğıt dokusu yerine tek arka plan kullanılır; kart dolgusu çerçevenin altına uzanır.
- Kilo verme planında isteğe bağlı 1–156 hafta seçilir. Önizleme, geri dönme, onay, yeniden açılış ve ileri tarihli plan sürümü süreyi saklar. Kilo korumada alan kapalıdır.
- Günlük hedefi aşan kayıt için Bugün ve tamamlanmış günlerin dönem özeti, yürüyüş/bisiklet/koşu dakika aralıkları gösterir. Kısmi kayıt geçici olarak işaretlenir. Hedef fazlası ve koruma fazlası ayrı temellere sahiptir; seçenekler birbirinin alternatifidir.

## Hesap ve sınırlar

Süre tahmini bir enerji bütçesi yaklaşımıdır; NIH Body Weight Planner uygulaması veya doğrulanmış fizyolojik bir öngörü değildir. Sabit 7700 kcal/kg ve Mifflin/PAL ile başlangıç–hedef kilosunun orta noktasındaki koruma ihtiyacı kullanılır. Metabolik uyum, vücut bileşimi ve su değişimleri modellenmez. Gerçek bitiş tarihi vaat edilmez.

Mevcut en fazla %20/500 kcal açık ve 1300 kcal alt sınırı korunur. Süreli plan `guardrails-v2` kullanır: daha uzun süreler için %10'dan küçük pozitif açık kabul edilebilir. Eski `guardrails-v1` planları ve eski günlük kayıt bağlantıları değişmez. Çok kısa sürede aralık sınırda kalır; seçilen süre ve taslağın hesaplanan daha uzun süresi birlikte gösterilir. Manuel aralık sessizce değiştirilmez.

Spor karşılığı mevcut Compendium 2024 MET değerlerinden dinlenme enerjisi çıkarılarak `(MET−1) × 3.5 × kg / 200` kcal/dakika üzerinden hesaplanır. ±%20 aerobik ve ±%40 kuvvet aralığı mevcut ürünün yaklaşık belirsizlik yaklaşımıdır; kişisel güven aralığı değildir. Günlük hareket zaten inclusive PAL içindedir; bu bilgi kalori hedefine ikinci bir hareket kredisi yazmaz. O güne kadar son kilo ölçümü kullanılır.

Kaynaklar:

- [NIH: sabit kalori/kilo kuralının kısıtları](https://www.niddk.nih.gov/health-information/professionals/diabetes-discoveries-practice/nih-body-weight-planner)
- [Compendium 2024](https://pacompendium.com/)
- [Compendium enerji hesap örnekleri](https://pacompendium.com/compendium-calculator/)

## Doğrulama

- TypeScript/üretim derlemesi, 43 domain/depo ve 24 DOM testi geçti; dokuz MP4 ve poster doğrulandı.
- Gerçek Chromium: dört hareket ve sekiz kalori sonucunda opaklık; beş genişlikte büyük kare video, küçük başlık ve ortalanmış ayar ikonu; süre sınırı/önizleme/geri/onay/yeniden açılış; kısmi ve tamamlanmış spor karşılığı kontrolleri `scripts/today-plan-browser-check.mjs` ve mevcut medya kontrolünde tanımlandı.
- Yerel tarayıcı indirimi ortamda başarısız olduğundan Chromium ve görsel kabul GitHub Actions üzerinden yapılır. Fiziksel Android testi değildir.
- Canlı yayın ve Chromium sonucu bu belgenin test commit'i için CI ve sonraki teslim mesajıyla doğrulanır.

Sosyal altyapı, su kayıtları, mevcut ikon ve video dosyaları bu turda değişmez.
