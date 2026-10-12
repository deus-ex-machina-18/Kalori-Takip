# Kalori, hedef haftası ve isteğe bağlı spor düzeltmesi

Taban: e3354a4 · 12 Ekim 2026.

## Bulgu ve sonuç

Mifflin erkek/kadın katsayıları ve yaş hesabı doğruydu. Mevcut alt hareket seçeneği 1,4 idi; çok az hareket için 1,2 eklendi. Eski çarpan değerleri değiştirilmez, açıklamaları netleştirilir. Bu kategoriler ürünün yaklaşık başlangıç seçenekleridir; kişisel harcama ölçümü değildir.

Süreli planın alt/üst sınırı ayrı kesildiğinde aralık ortalaması kayıyordu. Aralık şimdi iki tarafta aynı miktarda daralır. Sınırda tek değer olabilir. Süre artık yukarı tam haftaya yuvarlanmaz, bir ondalıkla gösterilir. Sürenin karşılanmadığı durumda bir haftalık sessiz tolerans kaldırıldı.

Spor takvimi yeni profilde varsayılan kapalıdır. Kullanıcı isterse manuel veya otomatik takvim açar. Seçilmeyen günler kapalıdır, geçersiz/boş alanları formu engellemez. Otomatik modda gün seçilmemesi aktivite seçimini zorunlu tutmaz. Spor takvimi kalori ihtiyacına eklenmez. Önizleme yaş/kilo/boy/formül, dinlenme ihtiyacı, hareket çarpanı, koruma ihtiyacı ve açığı gösterir; hesap tek domain fonksiyonundan gelir.

## Bağımsız örnekler

- 12.10.2026, 21.08.2000 doğum, 180 cm, 91 kg: erkek dinlenme 1910 kcal, 1,2 ile koruma 2292; kadın dinlenme 1744, koruma 2092,8 kcal.
- 92 kg erkek, 180 cm, 26 yaş, 1,6: koruma 3072. 84 kg hedef ve 22 hafta: aralık ortalaması 2608, süre 22 hafta. Önceki tek taraflı kesme yaklaşık 22,4 hafta ve ekranda 23 hafta üretirdi.
- Aynı örnekte 16 hafta 500 kcal başlangıç açık sınırına takılır. Hedef 2572 kcal ve yaklaşık 20,2 hafta gösterilir; kullanıcının istediği süre ayrı kalır.

Sabit 7700 kcal/kg ve orta nokta kilosu yaklaşımı korunur; fizyolojik tahmin modeli veya kesin bitiş tarihi değildir. Gerçek ihtiyaç kilo/veri ile değişebilir. Önceden kaydedilen planlar ve geçmiş günler yeniden yazılmaz; düzeltmeler yeni önizlemede ve ileri tarihli planlarda kullanılır.

Kaynaklar: https://pubmed.ncbi.nlm.nih.gov/2305711/ ; https://www.niddk.nih.gov/research-funding/at-niddk/labs-branches/laboratory-biological-modeling/integrative-physiology-section/research/body-weight-planner

## Doğrulama

Üretim build/TypeScript, 49 domain/depo ve 25 DOM testi. Yeni Chromium senaryoları mevcut `scripts/today-plan-browser-check.mjs` içine eklenmiştir: kapalı spor takvimi, seçili gün alanları, 22 hafta sınır örneği ve hesap dökümü. Yerel tarayıcı çalıştırılmadı; gerçek Chromium GitHub Actions üzerinden doğrulanır. CI/yayın sonucu teslimde ayrıca belirtilir.

Yerel kontrollerin tamamı geçti: 74 test (49 domain/depo, 25 DOM), TypeScript/build ve 11 MP4/poster kontrolü. Kullanıcı GitHub gönderimini ve canlı yayını onayladı. Chromium CI ve canlı yayın sonuçları teslimde doğrulanır.
