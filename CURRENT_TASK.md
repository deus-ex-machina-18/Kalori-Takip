# Güncel görev — Raund 2

Tek çıktı: mevcut beş ekran üzerinde profil + başlangıç planı + manuel kalori + gün tamamlama/geçmiş düzenleme + kilo + kalıcı IndexedDB takibi.

## Yetki ve sınır

Dosyalar: `src/domain/dates.ts`, `contracts.ts`, yeni `tracking.ts`; `src/data/indexeddb.ts`; `src/ui/tracker.ts`; `src/main.ts`, `styles.css`; ilgili testler, browser-check, paket kilidi ve bu devir belgeleri. Mevcut Vite/TypeScript ve beş ekran korunur.

## Tamamlanan kapsam

- Uygunluk sorulu profil; saat dilimi, boy/kilo/doğum tarihi/formül/PAL; açıklamalı önizleme ve onay. Kapsam dışı profil plansız kayıt yapabilir.
- Deterministik Mifflin × inclusive PAL planı; koruma veya kilo verme; immutable geçmiş ve ileri tarihli plan düzenlemesi.
- Toplam veya parçalı kcal; ekleme/düzeltme/silme; mod değişimi için dönüşüm/boşaltma/iptal. Kalori düzenlemesi günü yeniden açar.
- Gün onayı ve geçmiş gün seçimi. Eksik/kısmi günler kesin enerji dengesi üretmez; hedef farkı ile koruma farkı ayrıdır.
- Ondalık kilo ve bütün ölçümlerin korunması; günlük son ölçüm temsilcisi.
- IndexedDB v1; atomik profil/plan/başlangıç kilosu, atomik kayıt/işlem makbuzu; tekrar deneme kimliği, gün sürümü ve profil sürümü kontrolü; görünür hata, sessiz bellek fallback'i yok.

## Kabul kriterleri

650+800+500=1950; 2700/2200/2400 → hedef +200, açık +300; mod dönüşümü çift saymaz; düzenleme tekrar onay ister; yeniden açılış kayıtları korur; tekrarlanan yazma tek kayıt üretir; iki sekme değişikliği ezmez; yerel gece yarısı tarih hesabı ve geçmiş plan bağlantısı doğru; TypeScript/build/test ve Chromium genişlik/akış kontrolü geçer.

R3 hareket/haftalık motor, R4 gerçek 3D, R5 ödül/bildirim, R6 export/silme/hosting/bulut bu raundun dışında. Yayın yapılmadı. Kontrolün güncel sonucu HANDOFF.md'de.

Durum: tamamlandı. Yerel ve GitHub kontrollerinde 35 test + gerçek Chromium kabulü geçti; 56 görüntü ve hatasız rapor oluştu. Sonraki tek görev Raund 3. Başarılı koşu ve kaynak commit HANDOFF.md'de.
