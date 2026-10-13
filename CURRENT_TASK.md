# Güncel görev — Zilli 12–18 olay videoları

13 Ekim 2026. Tek çıktı: kullanıcıdan gelen yedi videonun su/spor/sosyal başarı olaylarına bağlanması.

Kapsam: olay seçimi, kısa bildirim oynatıcısı, medya ve kabul testleri. Hesap formülleri, günlük kayıt şeması ve mevcut 11 MP4 değişmedi. Yeni video üretimi yok.

Kullanıcı eşleştirmeyi doğruladı: 71009→12, …, 71015→18. 11 yok; su hedefine mevcut target-met kutlaması bağlandı.

Ana dal: başarılı bugünkü yeni spor kaydı ve son 7 gün / haftalık plan hedefi geçişi; su miktarı hedefi geçince tepki. Spor düzenleme, geçmiş tarih, su hedefini düşürme, tekrar kayıt ve sayfa açılışı kutlamayı tekrarlamaz. Sporsuz planda yalnız kayıt tepkisi vardır.

Sosyal bağlantılar ayrı social-infrastructure dalına hazırlanır. Bu dalın mevcut Auth/SMTP yayın engeli korunur; ana dala sosyal altyapı taşınmaz. Arkadaş kabulü, yeni gelen istek, grup kurma/katılım ve challenge oluşturma/katılım yalnız doğrulanmış sunucu durumu değişince kutlanır.

Kabul: build, 52 domain + 26 DOM testi ve 18 MP4/poster hash/fast-start kontrolü geçti. Yerel Chromium bulunmuyor; gerçek decode/olay tarayıcı testi GitHub CI'da çalıştırılacak. Kaynak videolardaki açık ağız kusuru manifestte kayıtlıdır; ses yok.

Sonraki tek iş: GitHub CI ve Netlify yayınının bu build'i sunduğunu doğrulamak.
