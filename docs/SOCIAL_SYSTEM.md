# Sosyal sistem — davetli pilot

11 Ekim 2026. Sosyal kodu hazır; kullanıcı tarafından sağlanan ayrı canlı Supabase projesi `cjlqnhegtdnkdoayeeks` üzerine şema, dört FK indeksi ve HTTP 409 çakışma düzeltmesi kuruldu. Auth panel ayarları, e-posta ve yayın kabulü açık.

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

## Canlı kurulum — yapılanlar ve açık kalanlar

Kullanıcı `kalori-takip` / `cjlqnhegtdnkdoayeeks` projesini sağladı. Mevcut seçilmiş organizasyon içinde ACTIVE_HEALTHY; başlangıçta tabloları ve Auth kullanıcıları boştu. Diğer uygulamalara erişilmedi.

- `social_foundation` ve `social_foreign_key_indexes` SQL transaction'ları uygulandı. `apply_migration` iki denemede requestState hatası verdiği için yetkili SQL bağlantısı kullanıldı. Aynı yerel iki sürüm, resmi CLI'nin migration history biçimiyle applied olarak kaydedildi; her history kaydı tam SQL statements içerir. SQL dosyaları kaynak depoda kalır.
- 13 uygulama tablosu RLS ile korunur; anon/authenticated tablo yetkileri kapalı; yalnız authenticated RPC erişir. Dört FK indeksi advisors bulgusuna göre eklendi. Kullanılmayan indeks INFO notları yeni ve boş veritabanında beklenir.
- Security advisors, erişim/RLS ERROR veya WARN bulmadı. Özel şemada `RLS Enabled No Policy` INFO, bilinçli deny-all tasarımıdır; doğrudan tablo politikası eklenmez. Auth için `Leaked Password Protection Disabled` WARN bulundu: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Panel erişimi olmadan bu ayar değişmedi.
- `netlify.toml` build ortamı yalnız Project URL ve `sb_publishable_` anahtarını içerir. Anahtar frontend için tasarlanmış halka açık yapılandırmadır; secret/service_role veya yönetici anahtarı yoktur. PR #4 Netlify önizlemesi bağlı yapılandırma ile build edildi; son sunulan bundle bağlantılı yerel build ile aynı. Cloud Chrome'da hesap giriş formu görüldü; üretim main değişmedi.
- Gerçek Auth/JWT kontrolleri üç ayrı `example.invalid` geçici hesaba karşı yürütülür. Bu hesaplar yalnız test fixture'ı olarak önceden doğrulanmış şekilde kurulmuştur; bu işlem kullanıcı kayıt e-postası teslimini doğrulamaz. Parolalar/tokenlar git dışında kalır. Test sonunda global signout tamamlandı. Scoped DELETE bağlantısı Invalid or expired requestState verdi: yalnız üç işaretli test hesabı banned_until=infinity ile yeni girişe kapatıldı; aktif refresh token sayısı 0. Test verileri halen durur, mevcut access JWT'ler normal sürelerinde sona erer. Gerçek hesaplara dokunulmadı.

Açık: Supabase Auth Site URL/Redirect URL listesi ve SMTP/e-posta teslimi. Güvenli panel girişinde kullanıcı GitHub, ardından Google yöntemini seçti; Google sayfasına erişim otomatik onay denetimi tarafından reddedildi. Bu tarayıcı giriş akışı durduruldu; farklı yoldan Google oturumu açılmadı. Gerekçe: Google sağlayıcısına erişim için güvenilir açık kullanıcı onayı bulunmaması.

Supabase'in yerleşik SMTP hizmeti yalnız organizasyonun ekip e-postalarına gönderir; davetlilerin kayıt/doğrulama ve şifre sıfırlama e-postaları için özel SMTP gerekir. Resmi kaynak: https://supabase.com/docs/guides/auth/auth-smtp . E-posta doğrulaması kapatılarak bu sınır aşılmaz.

Sonraki tek altyapı işi: panel oturumunu yetkili şekilde tamamla; gerçek HTTPS uygulama adresini Site/Redirect URL olarak ekle; kullanıcının seçtiği SMTP sağlayıcısını bağla; iki gerçek posta adresinde doğrulama ve şifre sıfırlama kabulünü yap. Sonra sosyal PR #4'ü ve hosting yayınını tamamla, iki cihazlı canlı kabulü yap.

## Kanıt ve sınır

`npm run check`: 39 mevcut domain/depo + 22 mevcut DOM + 16 yeni sosyal PostgreSQL/adaptör = 77 test, ayrıca 7 çok kullanıcılı DOM senaryosu; üretim build ve video bütünlüğü kontrolleri başarılı.

PGlite gerçek PostgreSQL yürütür; Auth kullanıcıları ve HTTP giriş servisi test fikstürleridir. Bu, canlı Supabase Auth, e-posta teslimi, hosting, Android tarayıcı veya piksel eşleşmesi kabulü değildir. Canlı migration ve advisors tamamlandı. 7 gerçek Auth/JWT/PostgreSQL DOM senaryosu ve son kaynakla 9 canlı API/kayıt senaryosu başarılı. Son kaynak dc18b07 için GitHub Actions 38166822493 build/test/Chromium başarılı. CI canlı Supabase yapılandırması olmadan çalışır; CURRENT_TASK.md kabul sınırlarını kaydeder. Sunucu ayarı olmadan uygulama sosyal bağlantının eksik olduğunu açıkça gösterir ve mevcut yerel takip çalışır.

## Canlı çakışma düzeltmesi ve kanıtlar

PostgREST 14.18, beklenen kayıt/işlem kimliği çakışması için kullanılan SQLSTATE 40001 kodunu sürekli yeniden denedi. 20261011190752_social_conflict_http_status migration'ı iki beklenen çakışmayı PT409 / HTTP 409 yapar; eski applied migration korunur. CloudRepository PT409'u conflict olarak döndürür. Sunucu loglarından doğrulanan iki takılan test backend'i sonlandırıldı. Yerel regresyon doğru hata kodunu ve güncel kaydın korunmasını, canlı kabul eski cihaz yazısının reddini doğrular.

Resmi açıklama: https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b .

- social-live-ui.json: gerçek Auth/JWT/PostgreSQL ile 7 JSDOM uygulama senaryosu; kaynak e3731e8. Gerçek tarayıcı/Android veya e-posta kabulü değildir.
- social-live-api.json: son kaynak dc18b07 ve üretim CloudRepository ile 9 canlı senaryo; süreç exit 0.
- social-browser-ci.json: son kaynak için başarılı CI; önceki indirilen/CRC doğrulanan Chromium kanıtında 5 genişlik ve altı ekranda taşma yok.
- social-deployment.json ve social-preview.jpg: doğru public config, son build ile byte eşitliği ve Cloud Chrome'da bağlı giriş ekranı.
- social-database.json: üç applied migration, erişim/advisors ve fixture temizliğinin gerçek sınırı.

Kanıtlarda e-posta teslimi false; üretim birleştirmesi, gerçek iki cihaz/Android ve orijinal referanslara piksel eşleşmesi açık.
