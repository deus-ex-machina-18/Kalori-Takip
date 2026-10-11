# Sosyal sistem — davetli pilot

11 Ekim 2026. Kod ve yerel PostgreSQL/DOM kabulü hazır; ayrı canlı Supabase projesi henüz yok.

## Kullanıcı akışları

- E-posta/şifre ile kayıt, doğrulama, giriş, şifre sıfırlama ve çıkış. Sosyal profil: kullanıcı adı, ad, kısa açıklama ve mevcut çizimlerden avatar. Hesap oturumu Supabase Auth tarafından yönetilir.
- Kullanıcı adı veya UUID arkadaş koduyla karşılıklı arkadaşlık isteği; kabul, reddetme, iptal, çıkarma, engelleme ve engeli kaldırma. Destek alkışı aynı arkadaşa günde bir kez bildirim üretir.
- Davetle katılınan özel gruplar: sahip/yönetici/üye rolleri, davet, çıkarma, ayrılma ve sahiplik devri. Sahip devretmeden ayrılamaz. Üye kendi rolünü yükseltemez.
- Davet bağlantısı ve elle kod girişi. Süre 7 gün; arkadaş daveti tek kullanım, grup daveti 20 kullanım. Davet sahibi iptal edebilir. Daveti veren yöneticinin yetkisi katılım anında yeniden kontrol edilir. Aynı kişi tekrar kullanınca ikinci üyelik/kullanım oluşmaz.
- Paylaşım başlangıçta kapalıdır. Alanlar: günün kayıt durumu, tam kalori miktarı, son 7 gün hareket dakikası, su hedefinin tamamlanması ve son kilo ölçümü. Hedef kitle: arkadaşlar, seçilmiş arkadaşlar veya seçilmiş gruplar. Arkadaş/grup üyeliği kişisel kayıtları kendiliğinden açmaz. Sunucu yalnız izin verilen alanları döndürür. Engelleme ortak grupta da iki kullanıcının birbirini ve challenge sonuçlarını görmesini keser.
- Grup challenge'ları: günlük kaydı tamamlama, hareket süresi veya kişisel su hedefi. Birlikte veya tamamlanan gün sıralaması; 1–30 gün. Katılım başlangıç gününe kadar açıktır. Herkes açıkça katılır; challenge hedefi/ilerlemesi gruba görünür olduğu katılımda açıklanır. Bu izin, diğer kişisel verilerin paylaşımından ayrıdır.
- Challenge hedefi katılım anında sabitlenir. Puan istemciden alınmaz; sunucu kayıt paketinden günlük tamamlanma durumunu türetir. Bir gün bir puan; tekrar gönderimler ve kayıt düzeltmeleri puan eklemez. Challenge'ın saat dilimi grup oluşturulurken sabitlenir. Önceki iki takvim gününde düzeltme açıktır; daha eski günler ve bitişten iki gün sonraki sonuçlar sabit kalır. Günlük kayıtlar manuel, cihaz/sensör doğrulaması yoktur.
- Uygulama içi bildirimler: arkadaş isteği/kabul, gruba katılım, yeni challenge ve alkış. Yenile düğmesi güncel durumu sunucudan getirir. Push, serbest sohbet ve herkese açık grup kataloğu yoktur.

## Kayıtlar ve erişim

`src/data/cloud.ts` aynı takip arayüzünü kullanır. Profil, planlar, kaloriler, hareket, kilo, kedi tercihleri ve su tek kullanıcıya ait sürümlü kayıt paketindedir. Pilot sınırı 2 MB. Tüm bulut yazıları sunucu onayı bekler; çevrimdışı başarı veya arka planda yazılmış olma iddiası yoktur. Hata durumunda form korunur. Cihazlar arası çakışma sürüm karşılaştırmasıyla reddedilir. Aynı işlem kimliği yeniden kullanılarak ağ hatası sonrası çift işlem önlenir; değiştirilmiş veriyle tekrar kullanılamaz. İşlem makbuzları kayıt paketinin kendisini çoğaltmaz.

İlk girişte yerel profil otomatik sahiplenilmez. Kullanıcı `Cihaz kayıtlarını aktar` ile gün/hareket/kilo miktarlarını inceleyip kendisine ait olduğunu onaylar. Aktarım yalnız boş bulut hesabına yapılır; kayıt ve plan bağlantıları korunur, sahip kimlikleri doğrulanmış hesaba bağlanır. Dolu hesapla otomatik birleştirme yoktur. Yerel kopya silinmez. Çıkış, bulut verisini bellekten temizleyip önceki yerel depoya döner.

`kalori_private` API'ye açılmayan şemadır. Tüm tablolarda RLS açıktır ve anon/authenticated doğrudan tablo erişimi yoktur. `public.kalori_rpc` yalnız authenticated rolüne açık SECURITY INVOKER kapısıdır. Privileged transaction `kalori_private.run` içinde auth.uid(), gerçek hesap varlığı, sahiplik, güncel üyelik/rol ve engelleme her işlemde doğrulanır. Diğer özel işlevler doğrudan çağrılamaz. user_metadata rol veya yetki belirlemez. Snapshotlar arkadaşlara/gruplara dönmez; yalnız izinli özetler döner. İstemciye yalnız `sb_publishable_` anahtarı kabul edilir; service-role/secret anahtar kullanılmaz.

Pilot limitleri: kişi başına 20 grup, grup başına 50 üye, grup başına 10 aktif challenge ve hesap başına saatte 300 başarılı yazı. Kayıtlar manuel olduğu için challenge sonuçları rekabet amaçlı bağımsız doğrulama sayılmaz.

## Dosyalar

- `src/ui/social.ts`: onaylı krem/yeşil/altın kart ve ikonlarla sosyal akışlar.
- `src/social/client.ts`, `types.ts`, `snapshot.ts`: Supabase oturumu/RPC, veri sözleşmesi ve açık aktarım.
- `src/data/cloud.ts`: hesap kapsamlı takip adaptörü; mevcut enerji motoru kullanılır.
- `supabase/migrations/20261010222524_social_foundation.sql`: şema, erişim, atomik işlemler ve puanlama.
- `.env.example`: yalnız yayınlanabilir frontend yapılandırması.
- `tests/social/`: gerçek PostgreSQL motorunda yetki ve veri kabulü.
- `scripts/social/ui-check.mjs`: DOM + Supabase HTTP sözleşme taklidi + gerçek PostgreSQL senaryoları.

## Canlı kurulum — açık kalan tek altyapı işi

Bağlı organizasyon `deus-ex-machina-18's Org`; kullanıcı bunu seçti. Ayrı Kalori projesi yok. `get_cost` iki kez UNAVAILABLE döndüğü için zorunlu maliyet onayı/proje oluşturma zinciri çalışmadı. BanaGöre ve diğer uygulamaların projeleri kullanılmadı, ücretli kaynak açılmadı.

1. Bu organizasyonda ayrı `kalori-takip` projesi oluştur; ücret/planı oluşturma ekranından doğrula. Proje bağlantısını paylaşmak yeterli, yönetici/servis anahtarı paylaşma.
2. Sağlıklı proje açılınca migration'ı yalnız bu projeye uygula; güvenlik danışmanlarını çalıştır ve gerçek JWT ile erişim testlerini tekrar et.
3. Project URL ve yayınlanabilir anahtarı hosting ortamına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_PUBLISHABLE_KEY` olarak ekle. Frontend yeniden build edilmelidir; bu değişkenler çalışma anında okunmaz.
4. Supabase Auth Site URL/Redirect URL listesini gerçek HTTPS uygulama adresine ayarla; e-posta doğrulaması açık kalır. Doğrulama ve şifre sıfırlama e-postalarını gerçek iki hesapla test et. E-posta gönderim kapasitesi/SMTP ayarını pilot öncesi kontrol et.
5. İki ayrı telefon/oturumda arkadaşlık, davet, kayıt aktarımı, senkronizasyon, paylaşımı kapatma, engelleme ve challenge puanını doğrula. Gerçek 390 px sosyal/dialog ekran görüntülerini incele. Sonra yayını tamamla.

## Kanıt ve sınır

`npm run check`: 39 mevcut domain/depo + 22 mevcut DOM + 16 yeni sosyal PostgreSQL/adaptör = 77 test, ayrıca 7 çok kullanıcılı DOM senaryosu; üretim build ve video bütünlüğü kontrolleri başarılı.

PGlite gerçek PostgreSQL yürütür; Auth kullanıcıları ve HTTP giriş servisi test fikstürleridir. Bu, canlı Supabase Auth, e-posta teslimi, hosting, Android tarayıcı veya piksel eşleşmesi kabulü değildir. Canlı migration ve Supabase advisors henüz çalıştırılamadı. Sunucu ayarı olmadan uygulama sosyal bağlantının eksik olduğunu açıkça gösterir ve mevcut yerel takip çalışır.
