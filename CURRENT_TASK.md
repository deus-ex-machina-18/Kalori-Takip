# Güncel görev — sosyal sistemin canlı bağlantısı

11 Ekim 2026 · sosyal PR #4: https://github.com/deus-ex-machina-18/Kalori-Takip/pull/4

Tek çıktı: sağlanan ayrı Supabase projesini mevcut sosyal koduna bağlayıp gerçek sunucuda doğrulamak.

Proje: kalori-takip / cjlqnhegtdnkdoayeeks · seçilen mevcut organizasyon · ACTIVE_HEALTHY.

Değişen bölüm: sosyal migration/indeksler, public frontend sunucu yapılandırması, canlı kabul betiği ve devir belgeleri. Mevcut görsel dil, kalori motoru ve IndexedDB v1 korunur. Main'e yeni eklenen dört Zilli etkileşimi sosyal dalıyla birleştirilir.

Kabul: gerçek Auth parolalı oturum/JWT ile arkadaşlık, davet, paylaşım, engelleme, bulut senkronizasyonu ve challenge; anonim/üçüncü kişi erişimi reddi; migration geçmişi; advisors; hosting build doğrulaması. E-posta teslimi ayrı gerçek posta kabulüdür.

Kuruldu: 13 kalori_private tablosu ve kontrol edilen RPC. Doğrudan anon/authenticated tablo erişimi yok. Veritabanı erişim kontrolünde ERROR/WARN yok; Auth leaked-password protection WARN açık; RLS/no policy bilgi notları bilinçli deny-all tasarımıdır. Dört FK indeksi eklendi. apply_migration iki kez requestState hatası verdi; aynı SQL transaction üzerinden execute_sql ile uygulandı.

Panel oturumu: kullanıcı güvenli girişte GitHub, ardından Google yöntemini seçti. Google sayfasına geçiş otomatik denetimde reddedildi; bu akış durduruldu. Auth Site URL/Redirect URL ve SMTP ayarı henüz değişmedi. Gizli/yönetici anahtarı kullanılmaz.

Canlı test/yayın sonucu tamamlanınca bu dosya güncellenir. Sonraki tek iş: doğrulamayı tamamla, panel girişi için gerekli açık onayı ve e-posta ayarını netleştir.
