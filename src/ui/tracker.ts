import { IndexedDbRepository } from '../data/indexeddb.ts';
import type { SetupWrite } from '../data/indexeddb.ts';
import type { DayLog, LocalDate, PlanVersion, Profile, WeightMeasurement } from '../domain/models.ts';
import type { Result } from '../domain/contracts.ts';
import { addLocalDays, localDateAt, parseLocalDate } from '../domain/dates.ts';
import { changeDay, engine, intake, newDay, nowUTC, planFor, representativeWeights, requireValue, uuid, validateProfile } from '../domain/tracking.ts';
import type { DayChange } from '../domain/tracking.ts';

export const escape = (value: unknown): string => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]!);
const number = (value: number): string => value.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
const weightNumber = (value: number): string => value.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const statusLabel = (day: DayLog | null): string => day?.status === 'completed' ? 'Tamamlandı' : day?.status === 'partial' ? 'Kısmi' : 'Girilmedi';
const button = (action: string, label: string, secondary = false) => `<button type="button" class="button ${secondary ? 'secondary' : 'primary'}" data-action="${action}">${label}</button>`;
const field = (name: string, label: string, type: string, value: unknown, attrs = '') => `<label class="field" for="${name}"><span>${label}</span><input id="${name}" name="${name}" type="${type}" value="${escape(value)}" ${attrs} required></label>`;

export class Tracker {
  readonly repository = new IndexedDbRepository();
  profile: Profile | null = null;
  plans: PlanVersion[] = [];
  days: DayLog[] = [];
  weights: WeightMeasurement[] = [];
  ready = false;
  busy = false;
  notice = '';
  error = '';
  private selectedDate: LocalDate | null = null;
  private selectedMode: 'total' | 'entries' = 'total';
  private switchTo: 'total' | 'entries' | null = null;
  private preview: { write: SetupWrite; explanation: string } | null = null;
  private editingProfile = false;
  private retry: (() => Promise<void>) | null = null;
  private lastToday: LocalDate | null = null;
  private refreshEpoch = 0;
  private loadFailed = false;
  private lastView = '';
  private draft: { profile: Profile; goal: 'lose' | 'maintain'; target: string } | null = null;
  private rerender: () => void;
  constructor(rerender: () => void) { this.rerender = rerender; }
  enter(screen: string): void { if (screen !== this.lastView) { this.switchTo = null; this.lastView = screen; } }
  today(): LocalDate { return localDateAt(new Date(), this.profile?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone); }
  async load(): Promise<void> {
    const epoch = ++this.refreshEpoch;
    try {
      const profile = requireValue(await this.repository.getLocalProfile());
      const [plans,days,weights] = profile ? await Promise.all([this.repository.listPlans(profile.userId), this.repository.listDays(profile.userId, parseLocalDate('1900-01-01'), parseLocalDate('9999-12-31')), this.repository.listWeights(profile.userId)]) : [];
      if (epoch !== this.refreshEpoch) return;
      this.profile = profile;
      this.plans = plans ? requireValue(plans) : [];
      this.days = days ? requireValue(days) : [];
      this.weights = weights ? requireValue(weights) : [];
      this.ready = true; this.loadFailed = false; this.lastToday = this.today();
    } catch (error) {
      if (epoch !== this.refreshEpoch) return;
      this.error = (error as Error).message;
      this.ready = false; this.loadFailed = true;
    }
    this.rerender();
  }
  checkMidnight(): void {
    if (!this.ready || this.busy || this.lastToday === this.today()) return;
    this.lastToday = this.today();
    this.notice = 'Yerel gün değişti. Yeni kayıt için Bugün ekranını yeniden açabilirsin; açık formun tarihi korunuyor.';
    const region = document.querySelector('#tracker-message');
    if (region) region.textContent = this.notice;
    // Do not replace a filled form at midnight. Its submit closure retains its date.
  }
  private day(date: LocalDate): DayLog | null { return this.days.find(day => day.date === date) ?? null; }
  private linkedPlan(day: DayLog | null, date: LocalDate): PlanVersion | null {
    return day ? this.plans.find(p => p.id === day.planVersionId) ?? null : this.profile?.automaticPlanEligibility === 'eligible' ? planFor(this.plans,date) : null;
  }
  messages(): string {
    return `<div id="tracker-message" tabindex="-1" role="${this.error ? 'alert' : 'status'}" class="${this.error ? 'error-message' : 'tracker-notice'}">${escape(this.error || this.notice)}</div>${this.retry ? button('retry','Aynı işlemi tekrar dene',true) : ''}${this.loadFailed || this.error ? button('reload','Güncel kayıtları yükle',true) : ''}`;
  }
  private prerequisites(): string {
    if (!this.ready) return `<p class="muted">${this.loadFailed ? 'Veri deposuna erişilemedi. Kayıt yapılamıyor.' : 'Kayıtların yükleniyor…'}</p>`;
    if (!this.profile) return `<p class="muted">Kayıt yapmaya başlamak için bir kez profilini oluştur.</p><a class="button primary" href="#/planim">Profilini oluştur</a>`;
    return '';
  }
  dayContent(date: LocalDate): string {
    const day = this.day(date), plan = this.linkedPlan(day,date);
    const calories = intake(day), summary = day ? requireValue(engine.summarizeDay(day,plan)) : null;
    const range = plan ? `${number(plan.calorieRangeKcal.min)}–${number(plan.calorieRangeKcal.max)} kcal` : 'Belirlenmedi';
    let balance = 'Günü tamamlayınca hesaplanır';
    let difference = '';
    if (summary?.kind === 'complete') {
      balance = summary.estimatedDeficitKcal >= 0 ? `Tahmini açık ${number(summary.estimatedDeficitKcal)} kcal` : `Koruma üstü ${number(-summary.estimatedDeficitKcal)} kcal`;
      difference = `<p class="hint">Hedef aralığına göre: ${summary.targetDifferenceKcal > 0 ? `+${number(summary.targetDifferenceKcal)} kcal` : summary.targetDifferenceKcal < 0 ? `${number(summary.targetDifferenceKcal)} kcal` : 'aralık içinde'}. ${summary.catState === 'care' ? 'Düşük tüketim veya yüksek tahmini açık, daha iyi sonuç anlamına gelmez. Beslenme ihtiyacını gözet.' : 'Bir günlük tahmin kilo değişimini göstermez.'}</p>`;
    } else if (day?.status === 'completed') balance = 'Plan yok; yalnız tüketim kaydı';
    return `<div class="card-top"><h2 id="day-heading">Günün özeti</h2><span class="status">${statusLabel(day)}</span></div><time class="subtle" datetime="${date}">${date}</time><div class="calorie-value">${calories === null ? '—' : number(calories)} <span>kcal</span></div><p class="day-note">${day?.status === 'completed' ? 'Günü tamamladın. Düzenlersen tekrar onay gerekir.' : calories === null ? 'Henüz kalori kaydın yok.' : 'Geçici toplam; günü tamamlayınca kesinleşir.'}</p><div class="metric-row"><span>Plan hedefi</span><strong>${range}</strong></div><div class="metric-row"><span>Tahmini enerji dengesi</span><strong>${balance}</strong></div>${difference}<p class="hint">Kayıt olmayan gün, sıfır kalori değildir. Kalorini dışarıda hesaplayıp buraya yaz.</p>${this.prerequisites() || this.calorieEditor(date,day)}`;
  }
  private calorieEditor(date: LocalDate, day: DayLog | null): string {
    const mode = day?.calories?.mode ?? this.selectedMode;
    const entries = day?.calories?.mode === 'entries' ? day.calories.entries : [];
    const confirmation = this.switchTo ? `<section class="confirm-box" aria-labelledby="mode-confirm"><h3 id="mode-confirm">Kalori modunu değiştir</h3><p>Yeni mod: ${this.switchTo === 'total' ? 'günlük toplam' : 'parça parça'}. ${this.switchTo === 'total' ? 'Parçaların ayrıntısı tek toplama dönüşecek.' : 'Günlük toplam tek parçaya dönüşecek.'} Eski ve yeni kaynak birlikte toplanmaz. Gün yeniden kısmi olur.</p><div class="actions">${button('mode-preserve','Değeri dönüştür')}${button('mode-reset','Boş giriş başlat',true)}${button('mode-cancel','İptal',true)}</div></section>` : '';
    return `<div class="calorie-editor" data-date="${date}"><div class="actions mode-tabs" aria-label="Kalori giriş modu"><button type="button" class="button ${mode === 'total' ? 'primary' : 'secondary'}" data-mode="total" aria-pressed="${mode === 'total'}">Günlük toplam</button><button type="button" class="button ${mode === 'entries' ? 'primary' : 'secondary'}" data-mode="entries" aria-pressed="${mode === 'entries'}">Parça parça</button></div>${confirmation}<form id="calorie-form" class="tracking-form">${field('kcal',mode === 'total' ? 'Günün toplam kalorisi (kcal)' : 'Eklenecek kalori (kcal)','number',mode === 'total' && day?.calories?.mode === 'total' ? day.calories.totalKcal : '', 'min="0" step="1" inputmode="numeric"')}<button class="button primary" type="submit">${mode === 'total' ? 'Toplamı kaydet' : 'Kalori ekle'}</button></form>${entries.length ? `<div class="entries-list">${entries.map((entry,i) => `<form class="entry-form" data-entry="${entry.id}"><label class="field"><span>${i+1}. parça (kcal)</span><input aria-label="${i+1}. parçanın kalorisi" type="number" name="entryKcal" value="${entry.kcal}" min="0" step="1" required inputmode="numeric"></label><button class="button secondary" type="submit">Düzelt</button><button class="button secondary" type="button" data-remove="${entry.id}">Sil</button></form>`).join('')}</div>` : ''}<div class="actions">${day?.status === 'completed' ? '<span class="tag">Gün tamamlandı</span>' : `<button type="button" class="button secondary" data-action="complete" ${intake(day) === null ? 'disabled' : ''}>Günü tamamla</button>`}</div></div>`;
  }
  records(): string {
    const date = this.selectedDate ?? this.today();
    return `<section class="card record-editor">${field('record-date','Düzenlenecek gün','date',date,`max="${this.today()}"`)}<p class="hint">Geçmiş günü düzenlemek, o günün planını değiştirmez.</p>${this.dayContent(date)}</section><div class="cards-two"><section class="card"><h2>Kalori geçmişi</h2>${this.days.length ? `<div class="history-list">${[...this.days].sort((a,b) => b.date.localeCompare(a.date)).map(d => `<button type="button" class="history-row" data-day="${d.date}"><span>${d.date}<small>${statusLabel(d)}</small></span><strong>${intake(d) === null ? '—' : number(intake(d)!)} kcal</strong></button>`).join('')}</div>` : '<p class="muted">Kalori kaydı yok. Eksik günler sıfır sayılmaz.</p>'}</section><section class="card"><h2>Kilo ölçümü</h2>${this.prerequisites() || `<form id="weight-form" class="tracking-form">${field('weight-date','Ölçüm günü','date',this.today(),`max="${this.today()}"`)}${field('weight-kg','Kilo (kg)','number','','min="20" max="400" step="any" inputmode="decimal"')}<button class="button primary" type="submit">Ölçümü kaydet</button></form>`}<p class="hint">Bir düzeltme için aynı güne yeni ölçüm ekle. Eski ölçüm korunur; son ölçüm günü temsil eder. Plan kendiliğinden değişmez.</p>${this.weightList()}</section></div><section class="card info-card"><h2>Hareket kayıtları</h2><p class="muted">Yürüyüş, koşu, bisiklet ve kuvvet kayıtları Raund 3’te eklenecek.</p></section>`;
  }
  private weightList(): string {
    return this.weights.length ? `<div class="history-list">${[...this.weights].sort((a,b) => b.date.localeCompare(a.date) || b.measuredAt.localeCompare(a.measuredAt) || b.id.localeCompare(a.id)).map(w => `<div class="history-row"><span>${w.date}<small>${new Intl.DateTimeFormat('tr-TR',{ timeZone:this.profile?.timeZone, hour:'2-digit', minute:'2-digit', second:'2-digit' }).format(new Date(w.measuredAt))} · kayıt zamanı</small></span><strong>${weightNumber(w.weightKg)} kg</strong></div>`).join('')}</div>` : '<p class="muted">Henüz kilo ölçümü yok.</p>';
  }
  planContent(): string {
    if (!this.ready) return `<section class="card">${this.prerequisites()}</section>`;
    if (this.preview) {
      const { write, explanation } = this.preview, p = write.plan;
      return `<section class="card preview-card"><h2>Başlangıç önizlemen</h2><p class="hint">${escape(explanation)}</p>${p ? `<div class="metric-row"><span>Günlük hedef aralığı</span><strong>${number(p.calorieRangeKcal.min)}–${number(p.calorieRangeKcal.max)} kcal</strong></div><div class="metric-row"><span>Tahmini koruma ihtiyacı</span><strong>${number(p.estimatedMaintenanceKcal)} kcal</strong></div><div class="metric-row"><span>Başlangıç</span><strong>${p.effectiveFrom}</strong></div><p class="hint">Mifflin × günlük hareket yaklaşımı bir tahmindir. Olağan egzersiz bu yaklaşımın içindedir; ayrıca yemek hakkı eklenmez. ${p.goal === 'lose' ? 'Aralık %10–20 ve en fazla 500 kcal açık sınırlarıyla seçildi. Kesin kilo verme tarihi vaat edilmez.' : 'Koruma modunda planlı açık yoktur.'}</p>` : '<p class="muted">Otomatik hedef üretilmedi. Plansız kalori ve kilo kaydı yapabilirsin.</p>'}<div class="actions">${button('save-profile',p ? 'Profil ve planı onayla' : 'Profilimi plansız kaydet')}${button('cancel-profile','Bilgilere geri dön',true)}</div></section>`;
    }
    const current = this.profile?.automaticPlanEligibility === 'eligible' ? planFor(this.plans,this.today()) : null;
    const future = [...this.plans].filter(p=>p.effectiveFrom>this.today()).sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom));
    const display = this.profile ? `<section class="card plan-summary"><h2>${current ? 'Güncel planın' : 'Plansız takip'}</h2>${current ? `<div class="metric-row"><span>Hedef aralığı</span><strong>${number(current.calorieRangeKcal.min)}–${number(current.calorieRangeKcal.max)} kcal</strong></div><div class="metric-row"><span>Koruma tahmini</span><strong>${number(current.estimatedMaintenanceKcal)} kcal</strong></div><p class="hint">${current.goal === 'lose' ? `Hedef kilo ${weightNumber(current.targetWeightKg!)} kg.` : 'Kilo koruma planı.'} Başlangıç ${current.effectiveFrom}. Geçmiş günler kendi planına bağlıdır.</p>` : '<p class="muted">Kayıtlarını otomatik hedef olmadan tutabilirsin.</p>'}${future.length ? `<p class="hint">Sıradaki plan ${future[0]!.effectiveFrom} tarihinde başlayacak. Aynı tarihe ikinci sürüm eklenmez.</p>` : ''}${button('edit-profile','Profil ve planı düzenle',true)}</section>` : '';
    return `${display}${!this.profile || this.editingProfile ? this.profileForm() : ''}${this.plans.length ? `<section class="card info-card"><h2>Plan geçmişi</h2>${[...this.plans].sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom)).map(p=>`<div class="metric-row"><span>${p.effectiveFrom} · ${p.goal === 'lose' ? 'kilo verme' : 'koruma'}</span><strong>${number(p.calorieRangeKcal.min)}–${number(p.calorieRangeKcal.max)} kcal</strong></div>`).join('')}</section>` : ''}`;
  }
  private profileForm(): string {
    const p = this.draft?.profile ?? this.profile, latest = [...this.plans].sort((a,b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
    const selected = (value: unknown, desired: unknown) => value === desired ? 'selected' : '';
    return `<section class="card"><h2>${p ? 'Profil ve plan düzenlemesi' : 'Seni tanıyalım'}</h2><p class="hint">Bu cihazda tek profil tutulur. Bilgilerini başka cihaza aktarma veya hesapla giriş henüz yok.</p><form id="profile-form" class="tracking-form"><div class="form-grid">${field('birth-date','Doğum tarihi','date',p?.birthDate ?? '',`min="1900-01-01" max="${this.today()}"`)}${field('height-cm','Boy (cm)','number',p?.heightCm ?? '','min="100" max="250" step="any" inputmode="decimal"')}${field('profile-weight','Güncel kilo (kg)','number',p?.weightKg ?? '','min="20" max="400" step="any" inputmode="decimal"')}<label class="field" for="formula-sex"><span>Hesap formülü için cinsiyet</span><select id="formula-sex" name="formula-sex" required><option value="">Seç</option><option value="male" ${selected(p?.formulaSex,'male')}>Erkek formülü</option><option value="female" ${selected(p?.formulaSex,'female')}>Kadın formülü</option><option value="not-provided" ${selected(p?.formulaSex,'not-provided')}>Vermek istemiyorum</option></select></label><label class="field" for="pal"><span>Günlük hareket (olağan egzersiz dahil)</span><select id="pal" name="pal" required><option value="">Seç</option>${[[1.4,'Çoğunlukla oturarak'],[1.6,'Hafif hareketli'],[1.8,'Hareketli'],[2,'Çok hareketli']].map(([v,l])=>`<option value="${v}" ${selected(p?.baseline.pal,v)}>${l}</option>`).join('')}</select></label>${field('time-zone','Saat dilimi','text',p?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,'autocomplete="off"')}<label class="field" for="goal"><span>Hedefin</span><select id="goal" name="goal" required><option value="maintain" ${selected(this.draft?.goal ?? latest?.goal ?? 'maintain','maintain')}>Kilomu korumak</option><option value="lose" ${selected(this.draft?.goal ?? latest?.goal,'lose')}>Kilo vermek</option></select></label><label class="field" for="target-weight"><span>Hedef kilo (yalnız kilo verme)</span><input id="target-weight" name="target-weight" type="number" value="${escape(this.draft?.target ?? latest?.targetWeightKg ?? '')}" min="20" max="400" step="any" inputmode="decimal"></label></div><fieldset class="eligibility"><legend>Otomatik plan uygunluğu</legend><p>Gebelik/emzirme, yeme bozukluğu öyküsü veya riski, özel tıbbi beslenme ihtiyacı, ilgili tedavi ya da metabolizmayı etkileyen bir durum var mı?</p><label><input type="radio" name="eligibility" value="eligible" ${this.draft?.profile.automaticPlanEligibility === 'eligible' ? 'checked' : ''} required> Hayır</label><label><input type="radio" name="eligibility" value="out-of-scope" ${this.draft?.profile.automaticPlanEligibility === 'out-of-scope' ? 'checked' : ''} required> Evet / emin değilim</label><p class="hint">Ayrıntılı sağlık bilgisi saklanmaz. Otomatik plan 19–59 yaşla sınırlıdır; diğer durumlarda plansız kayıt açıktır.</p></fieldset><button type="submit" class="button primary">Önizlemeyi göster</button>${p ? button('close-profile','Düzenlemeyi kapat',true) : ''}</form></section>`;
  }
  progress(): string {
    const weights = representativeWeights(this.weights), completed = this.days.filter(d=>d.status==='completed');
    return `<div class="cards-two"><section class="card"><h2>Kilo ölçümleri</h2>${weights.length ? `<p class="hint">Her günün son ölçümü gösterilir. ${weights.length < 2 ? 'Tek ölçüm eğilim değildir.' : 'Gözlenen kilo, kalori tahmininden ayrı tutulur.'}</p>${weights.map(w=>`<div class="metric-row"><span>${w.date}</span><strong>${weightNumber(w.weightKg)} kg</strong></div>`).join('')}` : '<p class="muted">Henüz ölçüm yok.</p>'}</section><section class="card"><h2>Kayıt özeti</h2><div class="metric-row"><span>Tamamlanan gün</span><strong>${completed.length}</strong></div><div class="metric-row"><span>Kısmi gün</span><strong>${this.days.filter(d=>d.status==='partial').length}</strong></div><p class="hint">Eksik günler sıfır kalori değildir. Eğilim ve haftalık değerlendirme sonraki raundda eklenecek.</p><a href="#/kayitlar" class="button secondary">Kayıtlara git</a></section></div>`;
  }
  private async persist<T>(action: () => Promise<Result<T>>, onSuccess: () => void, label: string): Promise<void> {
    if (this.busy) return;
    this.busy = true; this.error = ''; this.notice = 'Kaydediliyor…'; this.retry = null;
    this.setBusy(true);
    try {
      const result = await action();
      if (!result.ok) {
        this.error = result.message; this.notice = '';
        if (result.code === 'storage') this.retry = () => this.persist(action,onSuccess,label);
        this.showMessages();
      } else {
        this.error = ''; this.notice = label; onSuccess(); await this.load();
      }
    } catch (error) { this.error = (error as Error).message; this.notice = ''; this.retry = () => this.persist(action,onSuccess,label); this.showMessages(); }
    finally { this.busy = false; this.setBusy(false); }
  }
  private setBusy(busy: boolean): void {
    document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('main button, main input, main select').forEach(b => {
      if (busy) { b.dataset.wasDisabled = String(b.disabled); b.disabled = true; }
      else if ('wasDisabled' in b.dataset) { b.disabled = b.dataset.wasDisabled === 'true'; delete b.dataset.wasDisabled; }
    });
    document.querySelector('main')?.setAttribute('aria-busy',String(busy));
  }
  private showMessages(): void {
    const region = document.querySelector('#tracker-feedback');
    if (region) { region.innerHTML = this.messages(); this.bindMessages(); document.querySelector<HTMLElement>('#tracker-message')?.focus({preventScroll:true}); }
  }
  private bindMessages(): void {
    document.querySelector('[data-action="retry"]')?.addEventListener('click',()=>void this.retry?.());
    document.querySelector('[data-action="reload"]')?.addEventListener('click',()=>{ if (!this.busy) { this.error=''; this.notice='Güncel kayıtlar yüklendi; önceki değişiklik saklanmadıysa tekrar gir.'; this.retry=null; this.preview=null; void this.load(); } });
  }
  bind(screen: string): void {
    this.enter(screen);
    this.bindMessages();
    if (this.busy) this.setBusy(true);
    const editor = document.querySelector<HTMLElement>('.calorie-editor');
    if (editor && this.profile) {
      const date = parseLocalDate(editor.dataset.date!);
      const oldDay = this.day(date);
      const day = oldDay ?? newDay(this.profile,date,this.plans);
      const save = (change: DayChange) => {
        try {
          const updated = changeDay(day,change,!!oldDay), operationId=uuid();
          if (updated === day) return;
          void this.persist(()=>this.repository.saveDay(updated,{operationId,expectedRevision:oldDay?.revision ?? 0}),()=>{this.switchTo=null;},change.type==='complete' ? 'Gün tamamlandı.' : 'Kalori kaydedildi. Gün kısmi; bitirdiğinde tekrar tamamla.');
        } catch (e) { this.error=(e as Error).message; this.showMessages(); }
      };
      const mode = day.calories?.mode ?? this.selectedMode;
      document.querySelector<HTMLFormElement>('#calorie-form')?.addEventListener('submit',e=>{e.preventDefault(); const data=new FormData(e.currentTarget as HTMLFormElement); save({type:mode==='total'?'total':'add',kcal:Number(data.get('kcal'))});});
      document.querySelectorAll<HTMLFormElement>('.entry-form').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault(); save({type:'edit',id:form.dataset.entry!,kcal:Number(new FormData(form).get('entryKcal'))});}));
      document.querySelectorAll<HTMLElement>('[data-remove]').forEach(el=>el.addEventListener('click',()=>save({type:'remove',id:el.dataset.remove!})));
      document.querySelector('[data-action="complete"]')?.addEventListener('click',()=>save({type:'complete'}));
      document.querySelectorAll<HTMLElement>('[data-mode]').forEach(el=>el.addEventListener('click',()=>{
        if (this.busy || el.dataset.mode===mode) return;
        const chosen = el.dataset.mode as 'total' | 'entries';
        if (oldDay?.calories) { this.switchTo=chosen; } else { this.selectedMode=chosen; this.switchTo=null; }
        this.rerender();
      }));
      for (const preserve of [true,false]) document.querySelector(`[data-action="mode-${preserve?'preserve':'reset'}"]`)?.addEventListener('click',()=>{if(this.switchTo){this.selectedMode=this.switchTo;save({type:'switch',mode:this.switchTo,preserve});}});
      document.querySelector('[data-action="mode-cancel"]')?.addEventListener('click',()=>{this.switchTo=null;this.rerender();});
    }
    document.querySelector<HTMLInputElement>('#record-date')?.addEventListener('change',e=>{try{ const date=parseLocalDate((e.target as HTMLInputElement).value); if(date>this.today())throw new Error('Gelecek gün seçilemez.');this.selectedDate=date;this.switchTo=null;this.error='';this.rerender();}catch(e){this.error=(e as Error).message;this.showMessages();}});
    document.querySelectorAll<HTMLElement>('[data-day]').forEach(el=>el.addEventListener('click',()=>{this.selectedDate=parseLocalDate(el.dataset.day!);this.switchTo=null;this.rerender();document.querySelector<HTMLElement>('#record-date')?.focus();}));
    document.querySelector<HTMLFormElement>('#weight-form')?.addEventListener('submit',e=>{
      e.preventDefault(); if (!this.profile) return;
      try { const data=new FormData(e.currentTarget as HTMLFormElement),time=nowUTC(); const w:WeightMeasurement={id:uuid(),userId:this.profile.userId,date:parseLocalDate(String(data.get('weight-date'))),weightKg:Number(data.get('weight-kg')),measuredAt:time,updatedAt:time}; const operationId=uuid();void this.persist(()=>this.repository.saveWeight(w,{operationId}),()=>{},'Kilo ölçümü kaydedildi.'); }
      catch(e){this.error=(e as Error).message;this.showMessages();}
    });
    document.querySelector<HTMLFormElement>('#profile-form')?.addEventListener('submit',e=>{e.preventDefault();this.prepareProfile(new FormData(e.currentTarget as HTMLFormElement));});
    document.querySelector('[data-action="save-profile"]')?.addEventListener('click',()=>{if(this.preview){const write=this.preview.write,operationId=uuid();void this.persist(()=>this.repository.saveSetup(write,{operationId}),()=>{this.preview=null;this.draft=null;this.editingProfile=false;},'Profilin kaydedildi.');}});
    document.querySelector('[data-action="cancel-profile"]')?.addEventListener('click',()=>{this.preview=null;this.editingProfile=true;this.rerender();});
    document.querySelector('[data-action="edit-profile"]')?.addEventListener('click',()=>{this.editingProfile=true;this.rerender();});
    document.querySelector('[data-action="close-profile"]')?.addEventListener('click',()=>{this.editingProfile=false;this.draft=null;this.rerender();});
  }
  private prepareProfile(data: FormData): void {
    try {
      const timestamp = new Date(Math.max(Date.now(), this.profile ? Date.parse(this.profile.updatedAt)+1 : 0)).toISOString() as Profile['updatedAt'];
      const p:Profile={userId:this.profile?.userId ?? uuid(),birthDate:parseLocalDate(String(data.get('birth-date'))),heightCm:Number(data.get('height-cm')),weightKg:Number(data.get('profile-weight')),formulaSex:data.get('formula-sex') as Profile['formulaSex'],timeZone:String(data.get('time-zone')).trim(),baseline:{method:'inclusive-pal-v1',pal:Number(data.get('pal')),includesLoggedExercise:true},automaticPlanEligibility:data.get('eligibility') as Profile['automaticPlanEligibility'],updatedAt:timestamp};
      validateProfile(p);
      const today=localDateAt(new Date(),p.timeZone);
      if (p.birthDate>today) throw new Error('Doğum tarihi gelecekte olamaz.');
      const latest=[...this.plans].sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
      const nextDate=latest && latest.effectiveFrom>=today ? addLocalDays(latest.effectiveFrom,1) : this.profile ? addLocalDays(today,1) : today;
      this.draft={profile:{...p},goal:data.get('goal') as 'lose'|'maintain',target:String(data.get('target-weight') ?? '')};
      const result=engine.createInitialPlan(p,nextDate,{goal:data.get('goal') as 'lose'|'maintain',targetWeightKg:data.get('target-weight') ? Number(data.get('target-weight')) : null});
      if (!result.ok && result.code!=='out-of-scope') throw new Error(result.message);
      const proposed=result.ok ? result.value : null;
      if(proposed){proposed.previousVersionId=latest?.id ?? null;proposed.reason=this.profile ? 'user-edit' : 'initial';}
      else p.automaticPlanEligibility='out-of-scope';
      const time=nowUTC();
      const w:WeightMeasurement|null=!this.profile || p.weightKg!==this.profile.weightKg ? {id:uuid(),userId:p.userId,date:today,measuredAt:time,updatedAt:time,weightKg:p.weightKg} : null;
      this.preview={write:{profile:p,plan:proposed,weight:w,expectedProfileUpdatedAt:this.profile?.updatedAt ?? null},explanation:result.ok ? this.profile ? 'Yeni plan ileri tarihli başlar. Eski günlerin planı ve kayıtları korunur.' : 'Bilgilerin henüz kaydedilmedi. Onayladığında profil, ilk ölçüm ve başlangıç planı birlikte saklanır.' : result.message};
      this.error='';this.rerender();document.querySelector<HTMLElement>('#page-title')?.focus();
    } catch(e){this.error=(e as Error).message;this.showMessages();}
  }
}
