# Güncel görev — iPhone ana ekran kurulumu

12 Ekim 2026 · dal `feat/iphone-install` · başlangıç `1568ba5`.

Tek çıktı: iPhone/iPad için Safari ana ekran kurulum yönlendirmesi. Mevcut manifest kimliği ve 180 px Apple simgesi korunur. Apple uygulama başlığı/standalone meta ayarları ve çentik/kenar güvenli alanları eklenir. Bugün ekranındaki yardım düğmesi yalnız Apple mobil tarayıcısında görünür; ana ekrandan açılmış uygulamada gizlenir. Ayarlar’daki rehber profili olmayan kullanıcıya da açıktır.

Kapsam: `index.html`, `src/ui/install.ts`, `src/main.ts`, `src/styles.css`. App Store paketi, çevrimdışı çalışma, video eşleşmeleri, kayıt şeması, hesaplar ve sosyal bağlantı bu görev kapsamında değildir.

Kabul: üretim derlemesi ve mevcut 69 test geçti. Üretim bundle’ında dört cihaz senaryosu doğrulandı: iPhone Safari ve masaüstü kimlikli iPad yardım açma/kapatma; kurulu iPhone’da ve Android’de Bugün yardım düğmesinin gizlenmesi. Manifest/icon zaten mevcuttu. Fiziksel iPhone’da Safari kurulum işlemi bu ortamda test edilemedi.

Kurulum: Safari → Paylaş → Ana Ekrana Ekle → görünüyorsa Web Uygulaması Olarak Aç → Ekle. Kaynak: https://support.apple.com/tr-tr/guide/iphone/iphea86e5236/ios

Önceki altı video kabul kanıtı `docs/verification/zilli-six-videos-live.json` dosyasındadır. Sıradaki adım: dalı gönder, CI sonucunu kontrol et, güncel Netlify yayınının yeni bundle/meta ayarlarını sunduğunu doğrula.
