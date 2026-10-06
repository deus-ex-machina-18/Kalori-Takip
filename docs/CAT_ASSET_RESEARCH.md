# R4 — hazır varlık araştırması, 6 Ekim 2026

Kullanıcı referansı: ince doğal kürk, büyük parlak kahverengi gözler, yumuşak bebek kedi oranları, sıcak oda ışığı. Seçilen gri-beyaz yön değişmiyor. Hiçbir hazır kedi satın alınmadı veya projeye kopyalanmadı.

| Üreticinin sayfası | Somut sonuç | Karar |
|---|---|---|
| [Cute Fur Kitten Gray Animated](https://www.artstation.com/marketplace/p/OynR9/cute-fur-kitten-gray-animated) | 13.212 üçgen; Blender 2.91 sürümünde kürk var, FBX animasyonunda kürk yok. Standard lisans bir proje ve 2.000 satış / 20.000 görüntü sınırı bildiriyor. | Önizlemedeki kürkün web GLB'ye aktarımı ve açık depoda ham varlık dağıtımı doğrulanmadı. Satın alınmadı. |
| [Furry Kitty](https://blendswap.com/blend/12865) | CC0, basit rig, Blender 2.7x / Internal materyaller. | Önizlemenin şekli/kürk kalitesi referansa uymuyor; eski materyal portu gerekiyor. Kullanılmadı. |
| [Milo the Cat](https://malbersanimations.artstation.com/projects/EzPYan) | Üreticinin rig, animasyon ve kürk kartlı gerçek zamanlı kedi çalışması. | Bebek kedi oranları ve web için ham dosya dağıtımı ayrıca doğrulanmalı. Kullanılmadı. |

Seamless beyaz kürk albedosu imagegen ile üretildi, `assets/cat/` içinde kaynak/prompt korunuyor. Bu bir materyal swatch'ıdır; referans kedinin görüntüsü veya gerçek 3D geometri diye sunulmaz. Geometri/rig/animasyon özgün kaynaklardan üretilir. Three.js MIT RoomEnvironment hazır oda yansıma ortamı kullanılır; lisans `public/THIRD_PARTY_NOTICES.txt` içinde.

Yerel çalışma alanı kesinti sonrası sıfırlandı; yeniden kurulan model/sahne bu dalda tekrar test edilmeli. Önceki kaydedilmemiş çalışmanın testleri yeni kodun kabul kanıtı sayılmaz. Referanstaki görsel kaliteye ulaşıldığı iddia edilmez.

## Revizyon 4 — kullanılan teknik kaynaklar

- [Jérémie Piellard'ın gerçek zamanlı kürk açıklaması](https://piellardj.github.io/fur-threejs/readme/): WebGL'de shell/fins yaklaşımının birincil uygulama açıklaması. Bu revizyonda aynı ilke ile özgün, rigli katman shader'ı yazıldı; bu projeden kod veya varlık kopyalanmadı. İnce geometrik tüyler silüeti, katmanlar yoğun kısa kürkü oluşturur.
- [Three.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html): sheen, clearcoat, roughness ve çevre yansıması özellikleri. Katmanlar daha düşük maliyetli MeshStandardMaterial, temel kaplama/fibre ise fiziksel materyal kullanır.
- [Three.js SkinnedMesh](https://threejs.org/docs/pages/SkinnedMesh.html): buffer skin ağırlıkları, bind matrix ve aynı world transform'u paylaşan mesh'lerin bind davranışı. Katmanlar GLB kaplamasıyla aynı attached bind mode'da; böylece kedi döndürülünce veya rig oynayınca kürk ayrı dönmez.

Lisanslı hazır kedi alınmadı. Çalışma hedef referansa doğru bir iyileştirmedir; doğal kürk/oda ışığının birebir kabulü açık. Son raporlar ve gerçek render HANDOFF.md'dedir.
