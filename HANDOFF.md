# Raund 2 — devir teslim

Repo: https://github.com/deus-ex-machina-18/Kalori-Takip
Dal: main · sürüm 0.2.0 · 5–6 Ekim 2026
Son uygulama kodu: e50ef519827ede5bd5a12adca7602d2e86504a39
Doğrulanmış son kod + tarayıcı test düzeltmesi: cfb3f548cc6db2e1f17ecd0060e8ffa61da2e359
Bu belgeleri kaydeden sonraki commit uygulama kodunu değiştirmez.

## Durum

**Raund 1'in açık Chromium kabulü kapandı; Raund 2 tamamlandı ve main'de.** TypeScript, üretim build'i, **35 test (21 domain/depo + 14 DOM)** ve gerçek Chromium akış/yerleşim kontrolü GitHub'da geçti. Herkese açık yayın yapılmadı.

## Teslim edilen akış

- Mevcut beş ekran, framework ve görsel tokenlar korunur. Profil/plan formu ve önizleme; kapsam dışı profile plansız takip.
- Mifflin × inclusive PAL başlangıç motoru ve sürümlü planlar; düzenleme ileri tarihten başlar. Eski plan ve gün bağlantıları değişmez.
- Toplam veya parçalı kcal, parça ekleme/düzeltme/silme, mod dönüşümü/boşaltma/iptal, gün tamamlama ve geçmiş gün seçimi.
- Düzenlenen gün kısmi olur ve tekrar onay gerekir. Eksik gün sıfır değildir. Hedef farkı ve koruma tahmini farkı ayrı gösterilir.
- Kilo ölçümü ve geçmişi; tüm ölçümler korunur, son günlük ölçüm temsilcidir. Kilo kaydı eski planı değiştirmez.
- Gerçek IndexedDB v1 cihaz deposu; tek transaction ile veri+operasyon makbuzu. Profil/plan/ilk ölçüm atomiktir. OperationId tekrar denemede sabit, gün revision ve profil updatedAt ile kayıp güncelleme engellenir.
- Saklama/okuma hataları görünür; bellek fallback'i yok. Başarısız saklamada aynı işlem tekrar denenir; conflict güncel veri yükleme gerektirir. Açılışta IndexedDB getter hatası yakalanır.
- Yerel gece yarısında açık form tarihi korunur; “Yeni güne geç” yeni tarihi açar. Açık form yeni güne sessizce taşınmaz.

## Doğrulama

`npm ci` ve `npm run check` başarılı. Son yerel kontrol Node 24.19.0 / npm 11.9.0.

Zorunlu örnekler: 650+800+500=1950; 2700 koruma/2200 hedef/2400 tüketim → hedef +200, tahmini açık +300; tek kaynağa mod dönüşümü; eksik/kısmi güne kesin sonuç yok; tamamlanmış güne düzenleme tekrar onay ister; IndexedDB yeniden açılış kalıcılığı; aynı operationId tek kayıt; farklı payload conflict; iki sekme CAS; profile/plan/ölçüm rollback; yerel gece yarısı; geçmiş plan korunması. Kapsam dışı profil ve depo erişim hatası UI testleri geçti.

### R1 + R2 gerçek Chromium kabulü — başarılı

Başarılı koşu: https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/37375600559
Doğrulanan commit: cfb3f548cc6db2e1f17ecd0060e8ffa61da2e359
Artifact: browser-check, ID 11371421641; 56 PNG + report.json, errors=[].

- 320/360/390/768/1280px beş boş ve beş kayıtlı ekran: yatay taşma yok. R1 son kontrolleri alt navigasyonun üstünde erişilebilir; profil düzenleyici de her genişlikte kontrol edildi.
- Tab/Enter, başlık odağı, mevcut ekranı koruyan İçeriğe geç, geri/ileri navigasyonu, reduced-motion ve 200% eşdeğer reflow geçti. Test artık URL yanında hash render/odak durumunu da bekler.
- Tarayıcının gerçek IndexedDB'sinde profil onayı, 650+800+500, tamamlama, reload, mod iptal/dönüşüm, saklama hatası sonrası aynı işlem retry ve kilo yenileme kalıcılığı geçti. Hiç pageerror yok.
- 320px kayıtlı beş ekran ve profil düzenleyici, 390px profil önizlemesi ve 1280px Kayıtlar görsel olarak incelendi; kabulü engelleyen sorun görülmedi. Önceki R1 320px beş ekranı da incelendi.
- 640px reflow, 1280px %200 zoom eşdeğeridir; fiziksel Android veya gerçek tarayıcı zoom testi değildir.

## Çalıştırma ve veri

```bash
npm ci
npm run check
npm run dev
```

http://127.0.0.1:5173/#/bugun; üretim dist; tarayıcı kontrolü `npx playwright install chromium`, build ve `node scripts/browser-check.mjs`.

Tek cihaz/origin, tek yerel UUID profil. Oturum açma, güvenli çok kullanıcı izolasyonu, bulut senkronizasyonu ve yedekleme yok. Origin/site verisi temizliği veriyi silebilir. R3–6 store'ları şemada hazır ama işlevleri sahte başarıyla uygulanmış sayılmaz; adaptör yalnız R2 alt kümesini ve atomik saveSetup'ı uygular.

## Açık bağımlılıklar

- Fiziksel Android, gerçek %200 zoom ve ekran okuyucu pilot öncesi kontrol edilmedi.
- Klinik güvenlik incelemesi, tam NICE sayfası kontrolü, hosting/domain ve bulut kimliği/yetki ayrı bağımlılıklardır.
- Kedi 2D taslaktır; nihai görsel yön ve lisanslı GLB yok. Manifest tam offline/PWA/push değildir.

## Sonraki tek görev

R2 kabulü tamamlandı. **Sonraki tek görev yalnız Raund 3**: mevcut sözleşmelerle aktivite kaydı ve uygun haftalık plan değerlendirmesi; inclusive PAL içinde egzersizi tekrar enerji dengesine ekleme. Önce PROJECT, CURRENT_TASK, DATA_CONTRACT ve ENERGY_POLICY belgelerini oku. Framework'ü veya beş ekranı yeniden başlatma. R4–6 ekleme.
