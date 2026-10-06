# Güncel görev — Raund 3

Tek çıktı: mevcut beş ekranın üzerinde kalıcı aktivite takibi, kontrollü plan düzenleme ve uygun haftalık değerlendirme.

## Sınır

`src/domain/activity.ts`, `weekly.ts`, `tracking.ts`, `contracts.ts`; `src/data/indexeddb.ts`; `src/ui/tracker.ts`, mevcut `main.ts` ve `styles.css`; ilgili testler/browser-check ve devir belgeleri. Vite/TypeScript, beş ekran, günlük kalori/kilo akışları ve IndexedDB v1 korunur. Yeni şema veya framework yok.

## Uygulananlar

- Yürüyüş/koşu/bisiklet/salon-kuvvet; kaynakta tanımlı tempo/tür, dakika ve hesap kilosu, MET kodu ve tahmin aralığı. Kayıt ekleme/düzeltme/silme, hata/retry, atomik operasyon makbuzu ve iki sekmede önceki kayıt karşılaştırması.
- Olağan egzersiz günlük hareket tabanındadır; aktivite bilgisi günlük hedef/açığa tekrar eklenmez.
- Uygun günler ve sevilen aktivitelerden gerekçeli taslak; manuel hareket günleri/süreleri ve sınırları doğrulanan manuel kalori aralığı. Önizleme/geri dönüş/onay, ileri tarihli immutable plan sürümleri. Hedef ölçümünden sonra isteğe bağlı koruma önizlemesi.
- Son yedi kapalı gün: tamamlanan/kısmi/eksik sayıları, yalnız tamamlananların ortalaması, hareket ve kilo günleri. Aynı planla yedi tamamlanan gün ve care olmaması halinde kullanıcı planı gözden geçirebilir. Kalori veya kilo tahminiyle otomatik azaltma yok.

## Kabul

MET birimleri ve süre/kilo ölçeklemesi; kuvvette geniş belirsizlik; geçersiz/kapsam dışı giriş; CRUD/reload/retry/CAS; 2700/2200/2400 sonucunun harekette değişmemesi; manuel hedef kapıları; eski gün/plan korunması; eksik/karışık/care haftasına öneri yok; önizleme ve onaylı koruma geçişi; R2 regresyonları; TypeScript/build/test/gerçek Chromium akış ve genişlik kontrolleri.

R4 3D, R5 ödül/bildirim/geri bildirim, R6 export/silme/hosting/bulut yok. Yeni görsel/3D varlık için kullanıcı önce üç örnekten seçim yapacak. İsteğe bağlı hareket karşılığı kartı eklenmedi; egzersiz borcu dili yok.

Durum: tamamlandı; 50 test + TypeScript/build + gerçek Chromium kabulü başarılı. Son koşu, doğrulanmış commit, incelenen görseller ve açık bağımlılıklar HANDOFF.md’de. Sonraki tek görev Raund 4; önce üç örnekle kullanıcı estetik seçimi.
