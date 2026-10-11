# Güncel görev — gerçek sosyal sistem

11 Ekim 2026 · dal: social-infrastructure · taban: reference-ui / f53015b.

Tek çıktı: gerçek hesaplara bağlı arkadaşlık, davetli grup, paylaşım izni ve challenge sistemi.

Kapsam: Supabase Auth; kullanıcıya özel bulut kayıtları ve açık onaylı yerel aktarım; karşılıklı arkadaşlık; özel gruplar ve süreli/iptal edilebilir davet; alan/hedef kitle bazlı paylaşım; günlük tamamlanma üzerinden challenge; uygulama içi bildirimler.

Korunacak: altı ekranın onaylı krem/yeşil/altın tasarımı, Zilli videoları, kalori motoru ve yerel pilot verileri. Açık gruplar, serbest sohbet, push ve ücretli özellikler kapsam dışında.

Kabul: ayrı kullanıcılar arasında gerçek sunucu işlemleri; oturumsuz/üçüncü kullanıcı erişiminin reddi; engelleme ve paylaşım kapatma sonrası erişimin kesilmesi; tekrarlı işlemlerin çift kayıt oluşturmaması; mevcut testler ve sosyal veri testleri.

Altyapı engeli: bağlı organizasyonda Kalori projesi yok. Kullanıcı mevcut organizasyonu seçti. get_cost iki kez UNAVAILABLE döndü; yeni proje oluşturmanın zorunlu maliyet doğrulaması çalışmıyor. Diğer uygulamaların projesi kullanılmaz. Kod ve PostgreSQL testleri tamamlanır; canlı proje bağlantısı olmadan yayına hazır/çalışan bulut iddiası yapılmaz.

## Kod ve doğrulama sonucu

Gerçek işlem kodu ve migration hazır. `npm run check`: 77 test + 7 DOM/HTTP sözleşme/PostgreSQL senaryosu; build ve medya kontrolleri başarılı. Yerel test Auth fikstürünü kullanır; canlı Supabase Auth/e-posta/Android kabulü açık. Ayrıntı `docs/SOCIAL_SYSTEM.md`.

Sonraki tek görev: kullanıcı ayrı Kalori projesi bağlantısını sağladığında sunucu migration'ını kur, gerçek iki hesapla doğrula ve hosting ortamını bağla. Yalnız kodu göndermek canlı sosyal sistemi açmaz.
