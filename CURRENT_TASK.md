# Güncel görev — Zilli 12–18 olay videoları

13 Ekim 2026. Tek çıktı: kullanıcıdan gelen yedi videonun su/spor/sosyal başarı olaylarına bağlanması.

Kapsam: olay seçimi, kısa bildirim oynatıcısı, medya ve kabul testleri. Hesap formülleri, günlük kayıt şeması ve mevcut 11 MP4 değişmedi. Yeni video üretimi yok.

Kullanıcı eşleştirmeyi doğruladı: 71009→12, …, 71015→18. 11 yok; su hedefine mevcut target-met kutlaması bağlandı.

Ana dal: başarılı bugünkü yeni spor kaydı ve son 7 gün / haftalık plan hedefi geçişi; su miktarı hedefi geçince tepki. Spor düzenleme, geçmiş tarih, su hedefini düşürme, tekrar kayıt ve sayfa açılışı kutlamayı tekrarlamaz. Sporsuz planda yalnız kayıt tepkisi vardır.

Sosyal bağlantılar ayrı social-infrastructure dalına hazırlanır. Bu dalın mevcut Auth/SMTP yayın engeli korunur; ana dala sosyal altyapı taşınmaz. Arkadaş kabulü, yeni gelen istek, grup kurma/katılım ve challenge oluşturma/katılım yalnız doğrulanmış sunucu durumu değişince kutlanır.

Kabul: build, 52 domain + 26 DOM testi ve 18 MP4/poster hash/fast-start kontrolü geçti. GitHub Chromium kabulü geçti: https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/38365160191 . Su/spor gerçek UI tetikleri, temizlenme, tekrar koruması ve yedi dosyanın tamamının sona kadar çözümü başarılı. Kaynak videolardaki açık ağız kusuru manifestte kayıtlıdır; ses yok.

PR #9 ana dala birleştirildi: e610579d0e7217973ad5f04ffb4d95daaa2f7c10. Ana uygulama önizleme build'i test edilen bundle ile byte düzeyinde aynı; ana ve sosyal önizlemede yedi yeni MP4'nin tamamı video/mp4 HTTP 200 ve doğru SHA256 ile sunuldu. Sosyal videolar 359656b ile PR #4 taslak dalında bağlı; mevcut hesap/e-posta yayın engeli devam ediyor. Üretim ana adresi e3354a4 / index-93LtJA-u.js üzerinde kaldı. Netlify yeni main gönderimlerini error + skipped=true durumuyla atladı; önceki kalori düzeltmesi f6271b6 da atlanmış. Ayrıntılı build kaydı yetkili Netlify erişimi istiyor. Resmi ignore-builds sözleşmesine göre netlify.toml build.ignore=exit 1 ile Git tabanlı atlama kontrolü kaldırıldı; komut npm run build ve çıktı dist açık tanımlandı. Sonraki tek iş: bu küçük yapılandırma ile üretim yayınının tamamlandığını doğrulamak; sosyal Auth/SMTP ve fiziksel Android kabulü ayrı kalır.
