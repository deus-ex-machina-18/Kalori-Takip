# Veri sözleşmesi v1

Bu belge, `src/domain/models.ts` ve `contracts.ts` davranışını açıklar. Raund 2'de profil/plan/gün/kilo kapsamı IndexedDB v1 ile uygulanmıştır; diğer kayıt türleri sonraki raundlar içindir.

## Birimler, tarih ve kimlik

- Enerji **kcal**, boy **cm**, kilo **kg**, süre **dakika**. Ondalık kilo saklanır; UI yuvarlaması depolanan değeri değiştirmez. Kalori girişleri negatif olmayan, sonlu tamsayılar olacak; 0 ancak kullanıcının açık girişiyle kayıt sayılabilir, başarı sayılmaz. Çok düşük tüketim bakım durumudur.
- LocalDate: gerçek takvim tarihi, `YYYY-MM-DD`, UTC anı değildir. `parseLocalDate` doğrular. UTCInstant: UTC ISO-8601 `...Z`; adaptör sınırında doğrulama gerekir. Profil IANA saat dilimi cihazdan önerilir, kullanıcı değiştirebilir.
- Gün anahtarı `(userId, date)` benzersizdir. Günün saat dilimi kayıt anında saklanır; seyahat veya profil değişikliği geçmiş günleri taşımaz. Yeni kayıt varsayılan günü `localDateAt` ile hesaplar. `toISOString().slice(0,10)` bugünü hesaplamak için kullanılmaz.
- UUID kayıt/operasyon kimlikleri. Yerel pilot kimliği kimlik doğrulama değildir. Bulutta sunucu oturum kimliğini doğrular ve erişimi sınırlar.

## DayLog ve kalori modu

`missing`: calories null, completedAt null. Fiziksel kayıt olmaması da missing olarak sunulur.
`partial`: aktif calories var, completedAt null. Toplam geçicidir; nihai enerji sonucu yok.
`completed`: aktif calories ve completedAt zorunlu. Plan yoksa yalnız tüketim gösterilir, hedef/açık çıkarılmaz.

Calories ayrık bir birleşimdir: total modunda sadece totalKcal; entries modunda sadece entries. Entries toplamı sorgu anında türetilir; ayrı totalKcal alanı tutulmaz. Arayüz bir mod seçer. 650+800+500 = 1950.

Mod değişimi onay ekranı gösterir: eski değerleri **yeni kaynağa dönüştürme** (entries → total: türetilen toplam; total → entries: tek kalori girdisi) veya **yeni boş giriş başlatma** (partial durumuna dönme). İptal değişiklik yapmaz. İki kaynak hiçbir zaman birleştirilmez; kaybolacak eski parça ayrıntıları onayda açıkça belirtilir.

Tamamlanmış güne her kalori ekleme/düzeltme/silme veya mod değişimi: status partial, completedAt null, revision +1. Günü kullanıcı tekrar tamamlar. Türetilmiş özet ve kedi durumu yeniden hesaplanır. Aynı tamamlama isteğinin tekrar gönderilmesi yeni olay/ödül oluşturmaz.

## Plan ve hesap sonucu

PlanVersion append-only. Aynı kullanıcı ve effectiveFrom için çakışma reddedilir; yeni sürüm varsayılan olarak sonraki yerel gün başlar. Geri tarihli değişiklik otomatik yapılmaz. Kayıt oluşturulurken yürürlükteki plan id'si DayLog'a bağlanır; sonraki düzenlemeler bunu değiştirmez. Plan yokken null; sonradan oluşturulan plan eski kayda sessizce uygulanmaz.

Range min/max kapsayıcıdır. Hedef farkı: aralık içi 0; üstünde intake-max pozitif; altında intake-min negatif. Tahmini açık = estimatedMaintenance-intake; pozitif açık, negatif koruma üstü tüketim. Hareket zaten inclusive PAL içindedir ve bu değere tekrar eklenmez.

Motorun doğrulanmış örnek testi: koruma 2700, aralık 2200–2200, tamamlanmış tüketim 2400 → hedef farkı +200, tahmini açık +300. Kilo alma iddiası yok. Eksik/kısmi günlerde complete sonucu üretilemez. Gözlenen kilo değişimi enerji hesabından ayrı tutulur.

## Kilo, hareket, kedi ve bildirim

- Kilo: tüm ölçümler korunur; günün temsilcisi en geç measuredAt, eşitse id sırası belirlenmiş son ölçüm. Günlük temsilci ileride türetilir, kayıtlardan hiçbiri sessizce silinmez. Kilo düzeltmesi eski plan ve Activity weightKgAtCalculation değerini yeniden yazmaz.
- Hareket: yöntem, MET kodu, hesap anındaki kilo ve tahmin aralığı kayda bağlıdır. Aktivite brüt harcaması yalnız bilgi; contributionToBalance daima already-in-baseline. Yoğunluk/kaynak eşlemesi R3'te uygulanır.
- Kedi durum önceliği: eksik/kısmi veya plansız → neutral; tamamlanmış ve düşük tüketim → care; uygun aralık → celebrate-range; hedef üstü → encouraging; salt kayıt tamamlama → celebrate-record. Care kutlamayı bastırır. R4 eşik kararını aynı enerji politikasından alır.
- RewardLedger: `(userId,eventKey)` benzersiz. Kalori açığı büyüklüğü veya tekrar tamamlama ödül gerekçesi değildir.
- Bildirim: HH:mm yerel saat; IANA zone. Gece yarısını geçen sessiz aralık, izin iptali, tamamlanmış gün ve benzersiz olay kontrolü R5'te uygulanır. R1 izin istemez.

## IndexedDB v1 adaptörü — R2

Store'lar: profiles(userId), plans(id; userId+effectiveFrom unique), days(id; userId+date unique), activities(id; userId+date), weights(id; userId+date), catPreferences(userId), rewards(id; userId+eventKey unique), notifications(userId), operations(operationId; userId). Export schemaVersion=1; derived totals dışa aktarılacak asıl kaynak değildir.

Adaptör runtime doğrulama ve tek transaction ile kayıt+operationId yazacak. Aynı operationId ve aynı payload önceki sonucu döndürür; farklı payload conflict. expectedRevision uyuşmazsa conflict, sessiz son-yazan-kazan yok. Retry UI aynı operationId kullanır. Kota/IndexedDB erişim hatası storage sonucu ve kullanıcıya hata üretir; belleğe sessiz fallback yapılmaz. Şema sürümü yükselirse migrasyon ve hata yolu gerekir.

Buluta taşınırken aynı arayüz kullanılır; istemci store ayrımı sunucu yetkilendirmesinin yerine geçmez. Export ve tam silme R6 kullanıcı akışıdır; arayüzleri şimdiden tanımlı.

## R2 uygulama kararları

- Adaptör DataRepository'nin profil okuma, plan listeleme, gün/kilo yazma/listeleme alt kümesini uygular. Kapsam dışı metotlara sahte başarı döndürmez. `saveSetup` profil + isteğe bağlı plan + başlangıç ölçümünü tek transaction içinde kaydeder; profil CAS token'ı `expectedProfileUpdatedAt` değeridir.
- Profile uygunluk sorusuna her plan düzenlemesinde açık cevap gerekir. Ayrıntılı sağlık bilgisi tutulmaz. Kapsam dışı profile yeni günler plansız bağlanır; geçmiş bağlı günlerin planları değişmez.
- İlk profilin planı bugün başlar. Düzenleme varsayılan yarın; ileri tarihli bir sürüm zaten varsa onun ertesi günü başlar. Aynı effectiveFrom ikinci kez kullanılmaz, sürümler güncellenmez. UI serbest/sınırsız kalori hedefi açmaz; yeni plan profil ve hedef seçimiyle yeniden hesaplanır.
- Önizleme geri dönüşü girilen taslağı korur. Onay tek atomik işlemdir; profile/plan/başlangıç ölçümünün yalnız bir kısmı kaydedilemez.
- Boş total modunun sayısal temsili yoktur: boşaltma `missing + calories:null` olur; boş entries listesi `partial` olabilir. İki durumda da provisional toplam null ve tamamlama kapalıdır. Açık 0 girişi farklıdır.
- Gün düzenlemesinde expectedRevision zorunlu; yeni gün expectedRevision=0/revision=1. Aynı gün kimliği/saat dilimi/planı sabittir. Düzenlenen tamamlanmış gün önce partial olur. Depo sınırı gerçek takvim, UUID, UTC anı, sayısal aralık ve ayrık kalori kaynağını doğrular.
- Başarısız saklama için arayüz aynı closure/payload/operationId ile tekrar dener. Conflict tekrar denenmez; güncel veriyi yükleme seçeneği ve görünür hata sunulur. Değişiklik sessizce ezilmez.
- R2 kilo ölçümleri append-only; düzeltme aynı gün yeni ölçümdür. measuredAt, kullanıcının ölçümü kaydettiği UTC andır; seçtiği yerel ölçüm günü ayrı tutulur. Profildeki kilo plan girdisidir; sonraki ölçüm eski planı yeniden hesaplamaz.
- Yerel gün değişimi 30 saniyelik kontrol ve görünürlük dönüşünde fark edilir. Açık formun submit closure'ı gösterilen güne bağlı kalır; kullanıcı “Yeni güne geç” düğmesine basınca veya yeni Bugün ekranını açınca yeni yerel günü görür. Önceki günün verisi yeni güne taşınmaz.
- Koruma/kilo verme hedef önizlemesi UI'da yuvarlanır; kayıtlı hesap değerleri yuvarlanmaz. İlerlemem günlük son kilo temsilcisini ve tamamlanan/kısmi gün adetlerini gösterir; haftalık motor R3'tür.
