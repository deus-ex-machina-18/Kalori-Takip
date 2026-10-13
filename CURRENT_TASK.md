# 13 Ekim 2026 — Zilli 12–18 olay videoları

Yeni yedi video ve su için mevcut kutlama eklendi. Gerçek sunucu durum değişimleri arkadaş kabulü/yeni istek, grup kurma/davetle katılım ve challenge oluşturma/katılım için kısa Zilli tepkisi üretir. İlk hesap yükleme ve değişmeyen yenileme tepki üretmez. Aynı callback su/spor kaydına da bağlıdır. 11 numaralı kaynak eksiktir; kullanıcı 71009→12, …, 71015→18 eşleştirmesini doğruladı.

Build, 42 domain + 22 DOM + 16 bulut/PostgreSQL testleri ve 7 sosyal DOM/HTTP/PostgreSQL senaryosu geçti. Beş sosyal tepki senaryo içinde ayrıca doğrulandı. 16 MP4/poster hash/fast-start doğrulaması geçti. Mevcut 9 video değişmedi. Gerçek e-posta/Android kabulü yapılmadı; aşağıdaki Auth/SMTP yayın kapısı halen geçerlidir. Ana dala sosyal altyapı bu turda aktarılmaz.

---

# Güncel görev — sosyal sistemin canlı bağlantısı

11 Ekim 2026 · sosyal PR #4: https://github.com/deus-ex-machina-18/Kalori-Takip/pull/4

Arkadaşlık, davetli özel gruplar, paylaşım izinleri, challenge ve bulut kayıtları ayrı Supabase projesi cjlqnhegtdnkdoayeeks üzerine bağlandı. Mevcut krem/yeşil/altın dil ve dört Zilli etkileşimi korunur.

Kurulum: 13 private tablo, authenticated RPC, 4 FK indeksi ve üç applied migration. RLS açık; doğrudan anon/authenticated tablo okuması kapalı. Migration geçmişinde tam SQL statements bulunur.

Canlı kabul sırasında beklenen çakışmalar için kullanılan SQLSTATE 40001, PostgREST 14.18 üzerinde sonsuz yeniden denemeye yol açtı. social_conflict_http_status migration'ı bu iki hatayı PT409 / HTTP 409 yapar. CloudRepository conflict sonucunu doğru sınıflandırır. Loglardan eşleştirilen iki takılan test backend'i sonlandırıldı; eski migration değiştirilmedi.

Doğrulama tamam: 77 test + 7 yerel DOM/PostgreSQL senaryosu, build ve 9 MP4 kontrolü. Gerçek Supabase Auth/JWT/PostgreSQL ile 7 sosyal DOM senaryosu; son kaynak koduyla 9 canlı API/kayıt kontrolü geçti. Son kaynak commit dc18b07; GitHub Actions 38166822493 build/test/Chromium başarılı. CI canlı Supabase yapılandırması olmadan çalışır; canlı kanıt ayrı rapordadır.

Önizleme: https://deploy-preview-4--extraordinary-rolypoly-370c36.netlify.app/#/sosyal . Doğru Project URL ve publishable key içerir; sunulan bundle son yerel bağlantılı build ile aynı. Cloud Chrome'da bağlı giriş formu görüldü. Kanıtlar docs/verification/social-*. PR taslak ve birleştirilebilir; üretim main değişmedi.

Fixture temizliği: scoped DELETE aracı Invalid or expired requestState verdi. Yalnız üç işaretli geçici hesabın yeni girişi banned_until=infinity ile kapatıldı; aktif refresh token sayısı 0. Test verisi henüz silinmedi. Mevcut access JWT'ler normal sürelerinde sona erer. Gerçek hesaplara işlem yapılmadı.

Açık: Auth Site URL/Redirect URL, özel SMTP ve iki gerçek posta adresinde doğrulama/şifre sıfırlama kabulü. Test hesapları önceden doğrulanmıştı; e-posta teslimi başarılı sayılmaz. Auth leaked-password protection WARN açık; private RLS/no-policy INFO bilinçli deny-all tasarımıdır.

Panel girişi GitHub'dan Google'a geçti; Google sayfasına erişim otomatik onay denetiminde, sağlayıcıya özel açık kullanıcı onayı olmadığı gerekçesiyle reddedildi. Bu giriş farklı yoldan aşılmadı.

Sonraki tek iş: Google panel girişi için açık onayı al; Site/Redirect URL ve kullanıcının SMTP sağlayıcısını ayarla; gerçek posta kabulünü yap; işaretli test hesaplarını sil; sonra PR/yayını tamamla. Gerçek iki cihaz/Android ve orijinal görsellerle piksel kabulü açık.
