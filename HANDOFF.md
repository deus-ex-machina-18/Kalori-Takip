# 11 Ekim 2026 — sosyal canlı bağlantı ve kabul tamamlandı

Arkadaşlık, davetli grup, paylaşım, challenge ve bulut kayıtları kullanıcı projesi cjlqnhegtdnkdoayeeks üzerinde çalışır. 13 private tablo/RPC, 4 FK indeksi ve üç applied migration var. Public frontend ayarı netlify.toml; gizli anahtar yok. Main 3d56083'ün dokuz Zilli MP4 ve dört etkileşimi korunur.

77 test + 7 yerel DOM/PostgreSQL senaryosu; 7 gerçek Auth/JWT/PostgreSQL DOM senaryosu; son kaynakla 9 canlı API/kayıt kontrolü başarılı. Son kaynak dc18b07; GitHub Actions 38166822493 build/test/Chromium başarılı. Önizleme bundle son bağlantılı yerel build ile aynı. Kanıtlar docs/verification/social-*.

Canlı çakışma testi 40001'in PostgREST 14.18 üzerinde sonsuz retry hatasını ortaya çıkardı. 20261011190752_social_conflict_http_status, PT409/HTTP409 kullanır; CloudRepository conflict sınıflandırır. İki logla eşleştirilen backend sonlandırıldı. Eski applied migration'ı değiştirme.

Üç disposable test hesabı silme aracı Invalid or expired requestState verdiği için halen verileriyle durur. Yeni girişleri infinity ban ile kapalı; aktif refresh token sayısı 0. JWT'ler normal sürelerinde sona erer. Yalnız app_metadata kalori_test_run işaretli fixture'ları hedefle; gerçek hesap silme. Parola/JWT hiçbir kanıt dosyasında yok.

Önizleme: https://deploy-preview-4--extraordinary-rolypoly-370c36.netlify.app/#/sosyal . PR #4 taslak ve birleştirilebilir; üretim main değişmedi. E-posta/gerçek Android kabulü tamamlanmadı.

Sonraki tek görev: Google panel girişi için açık sağlayıcı onayını al. Otomatik ret geldi; farklı yoldan aşma. Site/Redirect URL + SMTP'yi ayarla; iki gerçek posta adresinde doğrulama/sıfırlama kabulünü yap, test fixture'larını sil ve PR/yayını tamamla. E-posta doğrulamasını kapatma; Auth leaked-password WARN'ı ve bilinçli private RLS/no-policy INFO'larını docs/SOCIAL_SYSTEM.md açıklar.

---

## Önceki görev kayıtları (tarihsel)

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

---

## Önceki Zilli turunun devir kaydı

# 11 Ekim 2026 — dört Zilli hareketi tamamlandı

Kedi alanına dokunma sevme tepkisini; altın çerçeveli Oyun, Esneme, Uyuklama kontrolleri ilgili videoyu oynatır. Tek tepki bittiğinde idle; kalori tepkisini kesmez, veri yazmaz, sonuç etiketini değiştirmez. Statik/hareket azaltma ve hata durumunda kontroller kapalı. Mevcut beş MP4 ve poster aynı; yeni klipler tıklamada yüklenir. Orijinaller git dışındadır, kaynak/hash/provenance aktif manifesttedir. Kaynaklar: `tmp5db31o32` touch, `tmp74yqbwr6` play, `tmp9byihacv` stretch, `tmpjd43eswb` sleep.

61 test/build/medya ve tam FFmpeg decode başarılı. [Chromium CI](https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/38118114893), commit `7c3c311801d8597a1107153665ff88af6f7dbe6d`, errors=[]. [PR #3](https://github.com/deus-ex-machina-18/Kalori-Takip/pull/3) main'e birleştirildi: `eadefe629dd03a2ba31623ca4661953017ddf304`. Canlı Netlify bundle test edilen yerel build ile aynı; dört yeni MP4 HTTP 200, video/mp4, manifest hash'leri ile aynı. Kanıtlar `docs/verification/zilli-actions-*`; Duman yalnız test adı, ürün varsayılanı Zilli.

Dokuz MP4 + poster 2.862.938 bayt, ilk yük aynı 312.844 bayt. Yeni üretim/ücretli servis yok. Kalori/depo/v1 şema, su ve Sosyal bu görevde değişmedi. Gerçek Android kabulü açık. Sonraki tek iş Android'de dört etkileşimin görsel kabulü; kalan dokuz klip kullanıcı gönderince ayrı tur. Eski devirler aşağıda tarihsel olarak korunuyor.

---

# 11 Ekim 2026 — arayüz teslim durumu

Güncel görev ve kabul sınırları `CURRENT_TASK.md` içindedir. Onaylı görsel dil altı ekrana uygulandı; domain/depo mantığı korunuyor, su takibi ve açıkça etiketlenmiş Sosyal önizleme eklendi. 61 test, build ve medya doğrulaması geçti. Piksel eşleşmesi ve tarayıcı kabulü tamamlanmadı. Kullanıcının 11 Ekim 2026 tarihli açık onayıyla `reference-ui` dalı ve taslak PR #2 GitHub'a gönderildi. Uygulama commit'i `1d0395fa1907c4da3f292a017ddcf1a424fa01a1`; test edilen kaynak ağacı `6305dc5bf94031724e438bef8edfb5ac6f79cea3` ile aynı. Main ve PR #1 değişmedi.

Yerel dal: `reference-ui`, taban: `a6291a3`. `npm ci && npm run check`; tarayıcı ortamı sağlanınca `node scripts/browser-check.mjs`. Sonraki tek görev: PR #2 üzerinde tarayıcı kanıtları ve referansla görsel karşılaştırma.

---

# R4 video entegrasyonu — devir

10 Ekim 2026 · `deus-ex-machina-18/Kalori-Takip` · dal `r4-visual-quality` · taslak PR #1.
Başlangıç head: `6b0b9ecf32709626b11269bd44c7e82062e4df28`. Yeni head için GitHub'ı esas al.

## Tamamlanan uygulama

- Eski aktif Three.js kedi, kullanıcının mevcut beş videosunu oynatan sabit açılı kartla değişti. Bekleme yeniden üretilmedi.
- Başarılı bugünkü tamamlama, ilgili tepkiyi bir kez oynatır. Sonra bekleme; sonuç yazısı kayıtlı veriden kalır. Yenileme/navigasyon replay üretmez. Kayıt hata/retry akışı korunur. Tamamlamada kart görünür alana getirilir.
- Aralık/sınır/koruma sonucu enerji motorunun farklarından sunulur; hesap motorları, veri tipleri ve IndexedDB v1 değişmedi. Care önceliği korunur.
- İsim/statik/hareket azaltma mevcut ayarlarda kalıcı. Kare medya contain; video gizliyken durur; hata poster/form yedeğine döner. İki video elemanı en fazla aynı anda; tepki dosyaları yalnız olayda yüklenir.
- Beş MP4: 640×640, Baseline/yuv420p, sessiz, fast-start, 24 fps. Orijinal 16 fps kaynaklara yeni hareket karesi uydurulmadı. 0,25 sn ortak başlangıç karesine çözünür. Aktif poster aynı idle ilk karesidir.
- Paket+poster 1.539.538 bayt; ilk yük 312.844 bayt. Bir 640px RGBA kare ~1,64 MB, iki kare ~3,28 MB: bu yalnız ham kare hesabıdır, gerçek decoder bellek ölçümü değildir.
- Oyun/esneme/uyku klipleri mevcut değil; eski 3D hareket/döndürme kontrolleri aktif karttan kaldırıldı. Kaynak 3D çalışma `docs/archive/r4-3d-handoff.md` ve mevcut dosyalarda korunur.

## Dosyalar

`src/ui/cat-card.ts`, `cat-video.ts`, `cat-result.ts`; `src/ui/tracker.ts` başarılı kayıt olayı; `src/main.ts`, ilgili CSS. Aktif medya/provenance/hash tek kaynak `public/cat-media/asset-manifest.json`. `scripts/prepare-cat-videos.py`, `validate-cat-media.mjs`, `cat-browser-check.mjs`, mevcut `browser-check.mjs`; `tests/cat-result.test.ts`.

## Doğrulama

- Beş MP4 yerelde FFmpeg ile sonuna kadar hatasız çözüldü.
- Yerel Chromium indirimi geçerli ZIP dönmedi; gerçek tarayıcı kabulü GitHub Actions'ta çalıştırılır.
- `npm run check`: TypeScript/üretim build + 39 domain/depo/sınır + 20 DOM = **59 test**, medya hash/bütçe/fast-start geçti.
- Gerçek Chromium: **başarılı** [Actions 38084061717](https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/38084061717), test edilen uygulama commit'i `4ccad767dfa40fdc0e897aa776438fc2d6d974f6`. Native IndexedDB/R2/R3 ve tercihler/retry, sekiz kcal/sınır sonucu, kısmi 800, gerçek video decode/ended/idle, sabit yazı, reload/navigasyon replay yok, başarılı completion retry, IntersectionObserver pause/resume, simüle görünmez sekme, beş genişlik contain, statik/hareket azaltma MP4 yok, idle/tepki 404 ve autoplay reddinde çalışan form. `errors=[]`.
- Artifact 11681885098: 75 dosya. Kalıcı kanıt `docs/verification/r4-video-browser-report.json`, `r4-video-metrics.json`, `r4-video-mobile-390.png`. Kartın görsel kesiti `r4-video-cat-card-390.png`. Tam ekran görüntüsünde klavye testinden kalan odaklı “İçeriğe geç” bağlantısı görünür; kesit yalnız kartın görsel incelemesidir.
- 390px ekranda medya kartı 304×304 CSS px; kaynak gerçekten 640×640 çözülür, object-fit contain. 320/360/768/1280 genişliklerde de taşma yok. Bunlar masaüstü Chromium'da mobil viewport sonuçlarıdır; fiziksel Android sonucu değildir.
- Sonraki belge/kanıt commit'i aynı uygulama ağacını korur; yeni head'de CI sonucu ayrıca kontrol edilir.

## Açık

Hedef-altı videoda kap klip ortasında belirip kayıyor; son kare çözünmesi bunu tamamen düzeltmez. Hedef üstü hafif uyarıda yan bakış/baş sallama zayıf. Fiziksel Android yükleme/pil/decode ve kullanıcı görsel kabulü açık. Yeni kedi/video üretilmedi; ücretli servis kullanılmadı. Main'e birleştirme/yayın yok.

## Sonraki tek görev

Son kullanıcı yönlendirmesi: kedi adı **Zilli**; varsayılan ad güncellendi. Eski ekranlarda Duman test adı görünebilir. Kullanıcı ayrı sohbette mobil ekran tasarımını çalışacak; önce mevcut video kartını ve uzun sonuçları kullanan 390px Bugün tasarımı, sonra aynı dilde diğer dört ekran. Çalışan hesap/depo/video davranışını veya karakter kimliğini yeniden tasarlama. Yeni özellik, video üretimi ve R5 bu tura eklenmez.

Tasarım uygulandıktan sonra aynı sürümü gerçek Android'de kontrol et. Sonra sorunlu klipleri/alternatifleri aynı ilk kare/kamera/ışıkla üret. Bildirim/ödül veya hesap değişikliği ekleme.
