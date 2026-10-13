# Zilli olay videoları — 13 Ekim 2026

| Kaynak | No | Medya | Olay |
|---|---:|---|---|
| eksik | 11 | target-met.mp4 (mevcut) | Su hedefi miktarla tamamlandı |
| 71009.mp4 | 12 | sport-recorded.mp4 | Bugünkü yeni spor kaydı |
| 71010.mp4 | 13 | sport-goal.mp4 | Son 7 günlük süre haftalık plan hedefini geçti |
| 71011.mp4 | 14 | friend-added.mp4 | Arkadaş kabulü onaylandı |
| 71012.mp4 | 15 | friend-request.mp4 | Yenilemede yeni gelen istek |
| 71013.mp4 | 16 | group-created.mp4 | Grup oluşturuldu |
| 71014.mp4 | 17 | group-joined.mp4 | Davetle yeni üyelik |
| 71015.mp4 | 18 | challenge-started.mp4 | Yeni challenge veya onaylı katılım |

Eşleştirme kullanıcı tarafından doğrulandı. Kısa, sessiz ve işlemleri engellemeyen bildirimde oynar; sonunda kaldırılır. Kare contain ile korunur. Her kaynak 640×640, 3,5625 sn; çıktı 24 fps Baseline/yuv420p, fast-start ve 3,541667 sn. Son 0,25 sn ortak başlangıca geçer. Bazı kaynaklarda ağız açılır; görüntü korundu, kusur giderildi iddiası yok.

Ana dalın eski 11 MP4/poster hashleri korundu; toplam 5.721.122 bayt, ilk Bugün yükü 312.844 bayt. Klipler olay anında yüklenir. Statik/hareket azaltmada yalnız poster/metin; sayfa geçişinde/hatada medya kaldırılır, gizli sekmede durur. Kalori/su/aktivite verisi oynatıcı tarafından yazılmaz.

Yerel: build, 52 domain + 26 DOM testi ve 18 MP4/poster doğrulaması geçti. Kaynak eski sosyal dalın 9 MP4'si korunarak beş gerçek sosyal tetikleyici ayrı sınanır; bu dalın Auth/SMTP kapısı nedeniyle üretimde sosyal oynatma iddiası yok. Chromium kurulu olmadığından scripts/cat-events-browser-check.mjs gerçek tarayıcı kabulü CI'a bırakılır.

## GitHub ve yayın kabulü

[Chromium CI](https://github.com/deus-ex-machina-18/Kalori-Takip/actions/runs/38365160191) başarılı. 78 test + medya kabulü, gerçek su/spor olayı ve yedi yeni dosyanın sona kadar oynatımı geçti. PR #9 ana dala e610579 ile birleştirildi. Önizleme bundle assets/index-DBE3PB89.js test edilen yerel çıktıyla SHA256 düzeyinde aynı. Ana/sosyal önizlemede 14 yeni MP4 yanıtının tamamı doğru hash ve video/mp4 HTTP 200. Sosyal dal 359656b; üretime birleştirilmedi. Fiziksel Android/e-posta kabulü iddiası yok.

Üretim kontrolü: 13 Ekim 07:58 UTC'de ana URL eski e3354a4 / index-93LtJA-u.js sürümünü sunuyordu. Netlify public deploy API yeni e610579/1aab1dc gönderimlerini state=error ve skipped=true olarak raporladı; önceki f6271b6 da atlanmıştı. Özel build kaydına erişim HTTP 401 verdi. Resmi https://docs.netlify.com/build/configure-builds/ignore-builds/ sözleşmesi kullanılarak netlify.toml içine command/publish ve ignore=exit 1 eklendi; TOML ayrıştırma geçti. Bu değişiklik hesap/veri/video kodunu değiştirmez; gerçek üretim yanıtı son kabul ölçütüdür.

Son yayın sonucu: 8aef3a5 yapılandırma denemesi de 6acde55626bacdfc51918cb0 deploy kaydında error/skipped=true döndü. Bu deneme kaynak seviyesinde atlama kontrolünün sorunu çözmediğini gösterir; gerçek hesap/üretim engelinin nedeni ayrıntılı log olmadan kesinleşmedi. Etkisiz netlify.toml geri kaldırıldı. Ana adres eski sürümü sunmaya devam eder; güncel işlevler PR #9 önizlemesinde doğrulanmıştır. Sonraki iş yetkili Netlify build kaydı ve üretim yayınıdır.
