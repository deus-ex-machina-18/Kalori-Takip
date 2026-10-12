/** iPad can request the desktop site and report itself as a Mac. */
export function isAppleMobile(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Safari owns installation; this button opens instructions, not a fake prompt. */
export const iphoneInstallButton = () => isAppleMobile() && !isStandalone()
  ? '<button type="button" class="text-button iphone-install-shortcut" data-install-help aria-label="iPhone’a yükleme adımlarını göster">Ana ekrana ekle</button>'
  : '';

export const iphoneInstallCard = () => `<section class="card install-card"><h2>iPhone ve iPad’e ekle</h2>
  <p class="muted">Kalori Takip’i ana ekranındaki simgesinden uygulama gibi açabilirsin.</p>
  <button type="button" class="button primary" data-install-help>Kurulum adımlarını göster</button></section>`;

export const iphoneInstallGuide = () => `<div class="install-guide"><h2>iPhone’a yükle</h2>
  <ol>
    <li>Bu sayfayı <strong>Safari’de</strong> aç. Başka bir uygulamanın içinde açıldıysa adresi kopyalayıp Safari’ye yapıştır.</li>
    <li><strong>Paylaş</strong> düğmesine dokun. Yeni Safari düzeninde önce sayfa menüsünü açman gerekebilir.</li>
    <li>Listede aşağı kaydırıp <strong>Ana Ekrana Ekle</strong> seç.</li>
    <li>Görünüyorsa <strong>Web Uygulaması Olarak Aç</strong> seçeneğini aç ve <strong>Ekle</strong> düğmesine bas.</li>
  </ol>
  <p class="hint">Ana Ekrana Ekle görünmüyorsa paylaşım listesinin altındaki Eylemleri Düzenle bölümünden ekleyebilirsin.</p>
  <p>Ana ekrandaki Kalori Takip simgesinden açıp kullanmaya başla.</p></div>`;
