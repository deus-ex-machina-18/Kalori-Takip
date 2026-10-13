# Zilli sosyal olayları — 13 Ekim 2026

71011→friend-added, 71012→friend-request, 71013→group-created, 71014→group-joined, 71015→challenge-started. Eşleştirme kullanıcıdan doğrulandı. 71009/71010 spor tepkileri; 11 eksik olduğu için su target-met kullanır.

Durum karşılaştırması RPC state yanıtından sonra yapılır. Başlangıç snapshot'ı ve aynı durum tekrarı kutlama üretmez. Yeni istek mevcut Yenile akışında görünür; push/Realtime eklenmedi. Retry/davet tekrarı ikinci üyelik/tepki üretmez. Kutlama hesap geçişinde temizlenir ve komut tamamlanana kadar tüketilmez. Bildirim kayıtlarını veya paylaşım izinlerini değiştirmez.

42 domain + 22 DOM + 16 bulut/PostgreSQL testi ve 7 sosyal DOM/HTTP/PostgreSQL senaryosu geçti. scripts/social/ui-check.mjs istek, kabul, grup kurma/katılım ve challenge katılımında gerçek olay değerini doğrular. Bu test yerel Auth/HTTP fikstürü + gerçek yerel PostgreSQL kullanır; gerçek e-posta veya yeni canlı hesap testi iddiası yok.

16 MP4/poster doğrulandı. Önceki 9 MP4/poster korundu. Kaynaklardaki açık ağız hareketi korunmuştur; ses yok. Mevcut PR #4 Auth/SMTP kapısı nedeniyle taslak kalır. Bu değişiklik yayın engelini kaldırmaz.
