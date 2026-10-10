# Güncel görev — onaylı mobil görsel dilin uygulanması

11 Ekim 2026 · `reference-ui` · başlangıç: `a6291a3` (`r4-visual-quality`).

Tek çıktı: kullanıcının altı referans görseline göre çalışan Kalori Takip arayüzü.

## Kapsam

Bugün, Kayıtlar, Planım, İlerlemem, Sosyal, Ayarlar; ortak krem/desenli zemin, koyu yeşil düğmeler, altın çerçeveler, serif başlıklar, yeniden kullanılan referans ikonları ve altı sekmeli navigasyon. Bugün ekranında son Su / İlerlemem kısayolu referansı kullanılır. Kalori formu açılır bölümde; hesap, onay, retry ve geçmiş kayıt akışları korunur. Su takibi kullanıcı ve yerel gün bazında ayrı v1 cihaz kaydında tutulur.

Enerji/hareket/haftalık domain hesapları ve IndexedDB v1 değişmez. Mevcut beş video korunur. Gerçek hesap/arkadaş/grup/challenge altyapısı bu görsel turda kurulmaz. Sosyal ekran bunu açıkça belirtir; paylaşım kapalıdır, sahte arkadaş ve katılımcı kayıtları yoktur.

## Kabul ve mevcut durum

- TypeScript / üretim build / 39 domain ve depo + 22 DOM = 61 test: başarılı.
- Video hash, fast-start, format ve boyut kontrolü: başarılı.
- Mobil piksel eşleşmesi ve gerçek tarayıcı QA: açık. Playwright Chromium indirmesi geçerli ZIP dönmedi. Cloud Browser yerel önizlemeye `ERR_CONNECTION_REFUSED` verdi. Görsellerle birebir eşleşme onaylandı iddiası yok.
- GitHub'a gönderim: 11 Ekim 2026'da kullanıcının açık onayıyla tamamlandı. Komut satırı kimlik doğrulaması bulunmadığı için bağlı GitHub bağlantısı kullanıldı. `reference-ui` dalı ve taslak PR #2 oluşturuldu; uygulama commit'i `1d0395fa1907c4da3f292a017ddcf1a424fa01a1`. Yerel/test edilen ve uzak kaynak ağacı aynı: `6305dc5bf94031724e438bef8edfb5ac6f79cea3`. Main'e birleştirme veya yayın yapılmadı.

Sonraki tek görev: PR #2 üzerinde tarayıcı kontrollerini çalıştır, gerçek mobil ekran görüntülerini referanslarla karşılaştır ve yalnız bulunan görsel farkları düzelt.
