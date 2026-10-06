import type { CatScene } from '../domain/contracts.ts';
import type { CatPreferences, DaySummary } from '../domain/models.ts';
import { CAT_PRESENTATION } from '../domain/cat.ts';
import { escape } from './tracker.ts';

export function catCard(preferences:CatPreferences, summary:DaySummary):string {
  const controls=[['left','Sola çevir'],['right','Sağa çevir'],['reset','Açıyı sıfırla'],['play','Oynayalım'],['stretch','Gerinsin'],['sleep','Uyusun']];
  return `<section class="cat-card" aria-labelledby="cat-heading" data-cat-state="${summary.catState}"><div class="card-top"><span class="tag">Kedim</span><span class="subtle">Gri-beyaz</span></div><div class="cat-viewport"><img class="cat-poster" src="${import.meta.env.BASE_URL}models/cat-poster.png" alt="Gri-beyaz, yuvarlak yüzlü yavru kedi" width="400" height="400"></div><h2 id="cat-heading">${escape(preferences.name)}</h2><p class="cat-message">${CAT_PRESENTATION[summary.catState].message}</p><div class="cat-controls" role="group" aria-label="Kediyle etkileşim">${controls.map(([action,label])=>`<button class="button secondary" type="button" data-cat-action="${action}" ${action==='sleep'?'aria-pressed="false"':''} disabled>${label}</button>`).join('')}</div><p class="cat-scene-status hint" role="status">Kedin hazırlanıyor…</p></section>`;
}
export function mountCat(host:HTMLElement, summary:DaySummary, preferences:CatPreferences):{dispose():void} {
  let disposed=false, scene:CatScene | null=null;
  const fallback=(reason:string)=>{
    if(disposed)return;
    host.dataset.sceneStatus='static';host.dataset.animating='false';host.querySelector('.cat-canvas')?.remove();
    host.querySelectorAll<HTMLButtonElement>('[data-cat-action]').forEach(b=>b.disabled=true);
    const status=host.querySelector('.cat-scene-status');if(status)status.textContent=reason;
  };
  if(preferences.sceneMode==='static')fallback('Statik görünüm açık. Bu tercih Ayarlar’dan değiştirilebilir.');
  else if(typeof WebGL2RenderingContext==='undefined')fallback('Bu tarayıcıda statik görünüm kullanılıyor.');
  else {
    host.dataset.sceneStatus='loading';
    void import('./cat-scene.ts').then(async({ThreeCatScene})=>{
      if(disposed)return;
      try{const mounted=new ThreeCatScene(host,summary,preferences,CAT_PRESENTATION,fallback);scene=mounted;await mounted.load();}
      catch{scene?.dispose();fallback('3D görünüm açılamadı. Statik kedinle kayıtlarına devam edebilirsin.');}
    }).catch(()=>fallback('3D görünüm yüklenemedi. Statik kedinle devam edebilirsin.'));
  }
  return {dispose(){disposed=true;scene?.dispose();}};
}
