# Güncel görev — Bugün ve plan akışını düzeltmek

11 Ekim 2026 · taban `309c947` · dal `fix/today-plan-activity`.

Tek çıktı: kullanıcının bildirdiği video, yerleşim, süreli hedef ve spor karşılığı sorunlarının çalışan canlı düzeltmesi.

Kapsam: `src/styles.css`, süreli plan sözleşmesi/hesabı ve IndexedDB doğrulaması, `src/ui/tracker.ts`, ilgili testler. Video/ikon dosyaları, sosyal altyapı ve su sistemi değişmez.

Kabul: beyaz video filtresi yok; büyük ve kırpılmayan kedi alanı; küçük başlıklar/ortalanan ayar ikonu; süre seçimine göre değişen, onayla saklanan plan; hedef/koruma ayrımıyla gerçek spor dakika aralıkları; eski kayıtlar korunur; domain/DOM/Chromium kontrolleri ve canlı dosya doğrulaması geçer.

Hesap kararları ve kanıt yolları: `docs/verification/today-plan-fixes.md`.

Sonraki tek adım: Chromium/görsel kabulü tamamla ve doğrulanan commit'i canlıya yayınla.
