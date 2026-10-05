# Enerji hesabı ve güvenlik politikası — tasarım v1

Kontrol tarihi: 5 Ekim 2026. R2 başlangıç motoru `src/domain/tracking.ts` içinde uygulanmıştır. Aşağıdaki kararlar bu motorun ve R3 devamının sözleşmesidir. Kaynakların tanımladığı yöntem ile ürünün seçtiği ihtiyatlı sınırlar ayrıdır.

## Kaynakta doğrulanan yöntemler

1. [Mifflin ve St Jeor, 1990 — özgün araştırma](https://pubmed.ncbi.nlm.nih.gov/2305711/): dinlenme enerji ihtiyacı tahmini. Basitleştirilmiş REE = 10 × kg + 6.25 × cm − 5 × yaş + s; araştırmadaki erkek grubu için s=5, kadın grubu için s=−161. Çalışma 19–78 yaş sağlıklı yetişkinlerde yapılmıştır. Bu sayı ölçülmüş metabolizma değildir.
2. [NIDDK Body Weight Planner](https://www.niddk.nih.gov/bwp): tipik PAL aralığı 1.4–2.5; çok hafif günlük düzen ve haftalık bazı hareketler örneği 1.6. Araç 1000 kcal altındaki hedefi kabul etmez. Bu aracın dinamik modeli burada uygulanmıyor; PAL × Mifflin birleşimi ürünün basitleştirilmiş tahminidir, NIDDK modelinin eşdeğeri diye sunulmaz.
3. [NIDDK kapsamı](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner): yetişkinlere yöneliktir; çocuklar, gebeler/emzirenler kapsam dışındadır.
4. [NICE NG246, Physical activity and diet](https://www.nice.org.uk/guidance/ng246/chapter/Physical-activity-and-diet): 800–1200 kcal düşük enerjili diyetler uzman hizmeti ve destek kapsamında ele alınır. Uygulamanın kontrolsüz otomatik hedefleri bu aralığa girmeyecek. Sayfa doğrudan 403 döndürdü; resmi sayfanın indekslenen öneri metniyle doğrulandı. Yayın öncesi tam rehber yeniden kontrol edilmeli.
5. [2024 Compendium, standard/corrected MET açıklaması](https://pacompendium.com/corrected-mets/): standard MET 3.5 ml O₂/kg/dk varsayımına dayanır; kişisel enerji harcamasını tam ölçmek amacıyla geliştirilmemiştir. R3'te brüt kcal/dk ≈ MET × 3.5 × kg / 200 kullanılacak ve sonuç tahmin aralığı olacak. Kuvvet egzersizleri için kesin dakikalı telafi iddiası yok.
6. [Older Adult Compendium, 2024](https://pubmed.ncbi.nlm.nih.gov/38242593/): ≥60 yaş için ayrı MET60+ kaynağı vardır. İlk pilot bu ayrı model eklenene kadar 19–59 yaş otomatik plan kapsamıyla sınırlıdır; bu yaş sınırı ürün kararıdır.

## Seçilen hesap politikası

Sürüm `mifflin-inclusive-pal-v1`. REE yukarıdaki formülle hesaplanır. Başlangıç koruma tahmini REE × PAL. Profilde PAL bütün günün düzenli hareketini ve olağan egzersizi içerir. Kullanıcıdan günlük hareket yaklaşımı açıkça alınır; sırf spor kaydı yaptı diye PAL ve hedef her gün değiştirilmez.

Aktivite kaydının kcal bilgisi **bilgi amaçlıdır**, koruma tahminine veya günlük yemek hedefine tekrar eklenmez. R1/R2 activity katkısı 0; R3 de inclusive policy'yi korur. Farklı bir net-aktivite modeli ancak yeni formül/plan sürümüyle, geçiş açıklamasıyla eklenebilir. Adım, saat ve egzersiz ayrı ayrı toplanmaz.

Ürün PAL seçimleri 1.4/1.6/1.8/2.0; uç durumlar ayrı değerlendirme gerektirir. Bunlar yaklaşık davranış gruplarıdır; kaynakta kişiye özel doğrulanmış katsayılar gibi sunulmaz. Hesap sonlu/pozitif kontrolü yapar. Yuvarlama en sonda UI'da; saklanan hesap sonucu ve sürümü deterministiktir.

## Otomatik plan güvenlik kapıları — ürün kararı

- İlk pilot yalnız 19–59 yaş, gerekli formül bilgisi verilmiş, gebelik/emzirme ve özel tıbbi beslenme gereksinimi olmayan yetişkinler. 18 yaş dahil geri kalan gruplara otomatik plan üretilmez; standart hesabın uygun olmadığı durumlar profil akışında değerlendirilir. Kullanıcı formül cinsiyetini vermek istemezse otomatik sayı uydurulmaz.
- Düşük mevcut/hedef BMI (<18.5), yeme bozukluğu öyküsü/riski, ilgili tıbbi tedavi veya metabolizmayı etkileyen durum beyanı → otomatik plan dışı. Kontrol bir teşhis değildir; kişisel tıbbi bilgiler gereksiz ayrıntıyla saklanmaz.
- Kilo verme taslak açığı: korumanın %10–20'si, mutlak üst açık 500 kcal/gün. Bunlar **konservatif ürün sınırları**, kaynakların herkese aynı reçetesi değil. Koruma modunda açık yok. Kesin hedef tarihe kilo vaadi yok.
- Otomatik hedef aralığının altı en az 1300 kcal/gün olacak. Bu, NICE düşük enerjili aralığının dışında kalmak için ürün tabanıdır; 1300 herkes için yeterlidir anlamına gelmez. Öneri bu koşulları sağlayamıyorsa sayıyı sessizce yukarı sıkıştırmak yerine otomatik plan reddedilir/gerekçe gösterilir.
- Üst sınır: herkese ortak “en yüksek güvenli kalori” yok. Kilo verme hedefi koruma tahminini aşamaz; koruma hedefi tahmine bağlıdır. REE×PAL sonuçları ve girdiler tutarsızsa plan üretilmez. Manuel düzenleme aynı kapıları ve kapsamı korur; sınırsız serbest hedef alanı açılmaz.
- Kayıt sistemi gerçekte alınan çok düşük/yüksek kaloriyi saklayabilir; bu değerleri yazmak ile böyle bir hedef önermek ayrı. Çok düşük kayıt, plan aralığının altı veya >%20/>500 tahmini açık kutlama üretmez; care sonucu normal kutlamayı bastırır. Eksik günlere açık/başarı üretilmez.

R2'de runtime giriş doğrulaması, uygunluk soruları, açıklamalı hedef önizlemesi ve kapsam dışı yollar uygulandı. Klinik güvenlik doğrulaması tamamlanmış iddiası yok; küçük pilot öncesi sağlık uzmanı incelemesi açık bağımlılıktır. LLM bu sayıları hesaplamaz.

## Sonraki motor için zorunlu örnekler

- Koruma 2700 / hedef 2200 / tamamlanan tüketim 2400: hedef farkı +200; tahmini açık +300. Kilo aldın denmez.
- Aynı gün 650+800+500 = 1950; mod değişikliği tüketimi iki kez saymaz.
- missing ve partial → kesin günlük enerji dengesi yok.
- Inclusive PAL + ek bisiklet kaydı: enerji dengesine ikinci harcama eklenmez.
- Düşük tüketim ve büyük açık → kutlama/ödül değil bakım; bir günlük enerji hesabından gözlenen kilo değişimi çıkarılmaz.

## Uygulanan aralık ve doğrulama

`POLICY` motorun tek sabit kaynağıdır. Kilo verme alt hedefi M − min(500, %20 × M), üst hedefi %90 × M; koruma M–M. Aralık ters dönüyorsa veya altı 1300'den düşükse sessiz sıkıştırma yapılmaz; kapsam dışı sonuç gösterilir. Boy 100–250 cm ve kilo 20–400 kg teknik giriş sınırlarıdır, sağlık uygunluğu onayı değildir. Kapsam/yaş/BMI/formül bilgisi kontrolleri ayrıca yapılır. Aralık önizlemede yuvarlanır, hesapta yuvarlanmaz. UI sınırsız manuel kcal hedefi sunmaz.
