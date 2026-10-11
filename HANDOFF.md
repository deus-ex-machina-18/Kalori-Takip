# Devir — sosyal sistem

11 Ekim 2026 · social-infrastructure · taban reference-ui; main'in güncel dosya ağacı aynı.

## Kararlar

Arkadaşlık + davetli özel gruplar. Mevcut altı sekme ve krem/yeşil/altın görsel dil korunur. Grup katılımı kişisel kayıtları açmaz; alan/hedef kitle bazlı paylaşım ayrı. Challenge ilerlemesi açık katılım izniyle gruba görünür. Manuel kayıt, günlük tamamlanma puanı, sabit hedef ve iki gün düzeltme penceresi. Serbest sohbet, açık gruplar, push ve yeni kedi videosu yok.

## Tamamlanan

Hesap/şifre akışları, sosyal profil; karşılıklı arkadaşlık ve engelleme; grup rolleri/devri/üyelik; süreli ve iptal edilebilir davetler; paylaşım izinleri; challenge ve sunucuda puan; uygulama içi bildirim. Bulut takip adaptörü, su senkronizasyonu ve açık onaylı yerel aktarım. Ücretli kaynak veya başka uygulama sunucusu kullanılmadı.

## Kabul

77 test + 7 DOM/HTTP sözleşme/PostgreSQL senaryosu; üretim build ve medya kontrolü başarılı. Giriş servisi ve auth kullanıcıları yerel test fikstürü. Gerçek Supabase/e-posta/Android ve görsel tarayıcı kabulü açık. Kaynak: docs/SOCIAL_SYSTEM.md; migration ve kurulum burada açıklanır.

## Engel

Organizasyon seçildi: deus-ex-machina-18's Org. Kalori projesi yok; Supabase get_cost iki kez UNAVAILABLE. Maliyet onayı/proje oluşturma zinciri bu nedenle tamamlanamadı. Başka proje seçerek bu engeli aşma. Yeni projeye migration uygulanmadı; ortam anahtarları ve hosting güncellenmedi.

## Sonraki tek görev

Kullanıcı ayrı kalori-takip Supabase projesini oluşturup proje linkini verdiğinde: bağlı araçlarla URL/yayınlanabilir anahtarı oku, migration'ı uygula, advisors + gerçek oturum testlerini yap, hosting ortamını bağla ve iki cihazlı canlı kabulü tamamla. Yeni modül/özellik ekleme.
