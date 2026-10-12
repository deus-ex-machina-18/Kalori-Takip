# Güncel görev — kalori, hedef haftası ve isteğe bağlı spor

12 Ekim 2026 · `fix/calorie-weeks-optional-exercise` · taban `e3354a4`.

Tek çıktı: kalori planını spor yapmadan kurabilmek ve hedef süresi hesabının aralık sınırlarında tutarlı kalması.

Kapsam: domain hesapları, profil/plan formu, kabul testleri. Tasarım varlıkları, videolar, sosyal altyapı, geçmiş günlük kayıtlar ve mevcut plan sürümleri korunur.

Kabul: çok az hareket seçeneği (1,2); spor takvimi varsayılan kapalı; sadece seçilen manuel günün alanları doğrulanır; boş otomatik takvim aktivite istemez; 22 haftalık sınır örneği 22 kalır; kısa süre sınırı açıkça gösterilir; hesap dökümü önizlemede görünür; kayıt/yeniden açılış çalışır. Kontrol sonucu `docs/verification/calorie-weeks-optional-exercise.md` içindedir.

Önceki iPhone kurulumu ve altı video geliştirmeleri ana dal tabanına dahildir. Sıradaki tek adım: CI kabulü ve Netlify yayınının yeni sürümü sunduğunu doğrulamak.

## Teslim durumu

Üretim build, 49 domain/depo + 25 DOM testi ve 11 MP4/poster doğrulaması geçti. Kullanıcı 12 Ekim 2026'da “Canlı uygulamaya aktar” diyerek GitHub gönderimini ve yayını açıkça onayladı. Terminalde GitHub yazma kimliği bulunmadığından bağlı GitHub konektörü kullanılır. CI Chromium kabulünden sonra ana dal ve Netlify yayını doğrulanır.
