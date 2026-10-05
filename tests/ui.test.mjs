import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
import { IDBFactory } from "fake-indexeddb";
import { webcrypto } from "node:crypto";
const html = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const asset = readdirSync(new URL("../dist/assets/", import.meta.url)).find(
  (name) => name.endsWith(".js"),
);
const script = readFileSync(
  new URL(`../dist/assets/${asset}`, import.meta.url),
  "utf8",
);
async function until(predicate) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 4000) throw new Error('Arayüz beklenen duruma geçmedi.');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

function fill(app, id, value) { app.document.getElementById(id).value = value; }
async function createProfile(app, eligibility = 'eligible') {
  fill(app,'birth-date','2000-08-21'); fill(app,'height-cm','180'); fill(app,'profile-weight','91');
  fill(app,'formula-sex','male'); fill(app,'pal','1.4'); fill(app,'time-zone','Europe/Istanbul');
  app.document.querySelector(`[name="eligibility"][value="${eligibility}"]`).checked = true;
  app.document.querySelector('#profile-form').requestSubmit();
  await until(()=>app.document.querySelector('[data-action="save-profile"]'));
  app.document.querySelector('[data-action="save-profile"]').click();
  await until(()=>app.document.querySelector('.plan-summary') && app.document.querySelector('main').getAttribute('aria-busy') !== 'true');
}
async function launch(hash = "/bugun", reducedMotion = false, factory = new IDBFactory()) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: `https://example.test/#${hash}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole,
  });
  Object.defineProperty(dom.window, "indexedDB", factory === 'denied-getter' ? { get(){throw new DOMException('denied','SecurityError');}, configurable:true } : { value: factory, configurable: true });
  Object.defineProperty(dom.window, "crypto", { value: webcrypto });
  dom.window.matchMedia = () => ({ matches: reducedMotion });
  dom.window.scrollTo = () => {};
  dom.window.eval(script);
  const app = { dom, window: dom.window, document: dom.window.document, errors };
  await until(() => app.document.querySelector("main")?.dataset.ready === "true" || app.document.querySelector(".error-message"));
  return app;
}
async function navigate(window, link) {
  await new Promise((resolve) => {
    window.addEventListener("hashchange", resolve, { once: true });
    link.click();
  });
}
test("beş ekran arasında gerçek linklerle geçiş ve başlık odağı", async () => {
  const app = await launch();
  try {
    for (const id of ["kayitlar", "planim", "ilerlemem", "ayarlar", "bugun"]) {
      await navigate(
        app.window,
        app.document.querySelector(`nav a[href="#/${id}"]`),
      );
      assert.equal(app.window.location.hash, `#/${id}`);
      assert.equal(
        app.document.querySelectorAll('nav [aria-current="page"]').length,
        1,
      );
      assert.equal(
        app.document
          .querySelector('nav [aria-current="page"]')
          .getAttribute("href"),
        `#/${id}`,
      );
      assert.equal(app.document.querySelectorAll("h1").length, 1);
      assert.equal(app.document.activeElement.id, "page-title");
    }
    assert.deepEqual(app.errors, []);
  } finally {
    app.dom.window.close();
  }
});
test("boş gün sıfır kalori veya uydurma kişisel hedef göstermez", async () => {
  const app = await launch();
  try {
    assert.match(app.document.querySelector(".calorie-value").textContent, /—/);
    assert.equal(
      app.document.querySelector(".status").textContent,
      "Girilmedi",
    );
    assert.match(
      app.document.querySelector(".day-card").textContent,
      /Belirlenmedi/,
    );
    assert.equal(app.document.querySelector("#calorie-form"), null);
    assert.match(
      app.document.querySelector(".scene-caption").textContent,
      /Raund 4/,
    );
    assert.deepEqual(app.errors, []);
  } finally {
    app.dom.window.close();
  }
});
test("yanlış rota güvenli başlangıca döner", async () => {
  const app = await launch("/olmayan-ekran");
  try {
    assert.equal(app.window.location.hash, "#/bugun");
    assert.equal(
      app.document
        .querySelector('nav [aria-current="page"]')
        .textContent.trim(),
      "Bugün",
    );
  } finally {
    app.dom.window.close();
  }
});
test("sistem hareket tercihi ve oturum içi ayar navigasyonda korunur", async () => {
  const app = await launch("/ayarlar", true);
  try {
    const motion = app.document.querySelector("#motion");
    assert.equal(motion.checked, true);
    assert.equal(app.document.documentElement.dataset.reducedMotion, "true");
    motion.click();
    assert.equal(app.document.documentElement.dataset.reducedMotion, "false");
    await navigate(
      app.window,
      app.document.querySelector('nav a[href="#/bugun"]'),
    );
    await navigate(
      app.window,
      app.document.querySelector('nav a[href="#/ayarlar"]'),
    );
    assert.equal(app.document.querySelector("#motion").checked, false);
    assert.deepEqual(app.errors, []);
  } finally {
    app.dom.window.close();
  }
});
test("içeriğe geç bağlantısı ve semantik navigasyon mevcut", async () => {
  const app = await launch();
  try {
    assert.equal(
      app.document.querySelector(".skip-link").getAttribute("href"),
      "#main",
    );
    assert.ok(app.document.querySelector("main#main"));
    assert.equal(
      app.document.querySelectorAll('nav[aria-label="Ana navigasyon"] a')
        .length,
      5,
    );
  } finally {
    app.dom.window.close();
  }
});

test('profil önizleme/onay, parçalı giriş, tamamlama, düzeltme ve yeniden açılış', async () => {
  const factory = new IDBFactory();
  const app = await launch('/planim',false,factory);
  try {
    await createProfile(app);
    await navigate(app.window,app.document.querySelector('nav a[href="#/bugun"]'));
    app.document.querySelector('[data-mode="entries"]').click();
    for (const kcal of [650,800,500]) {
      fill(app,'kcal',String(kcal)); app.document.querySelector('#calorie-form').requestSubmit();
      await until(()=>app.document.querySelector('main').getAttribute('aria-busy')!=='true');
    }
    assert.match(app.document.querySelector('.calorie-value').textContent,/1.950/);
    assert.equal(app.document.querySelector('.status').textContent,'Kısmi');
    app.document.querySelector('[data-action="complete"]').click();
    await until(()=>app.document.querySelector('.status').textContent==='Tamamlandı');
    assert.match(app.document.querySelectorAll('.metric-row')[1].textContent,/Tahmini açık/);
    const entry=app.document.querySelector('.entry-form'); entry.querySelector('input').value='700'; entry.requestSubmit();
    await until(()=>app.document.querySelector('.status').textContent==='Kısmi');
    assert.match(app.document.querySelector('.calorie-value').textContent,/2.000/);
  } finally { app.dom.window.close(); }
  const reopened = await launch('/bugun',false,factory);
  try { assert.match(reopened.document.querySelector('.calorie-value').textContent,/2.000/); assert.equal(reopened.document.querySelectorAll('.entry-form').length,3);assert.deepEqual(reopened.errors,[]); }
  finally {reopened.dom.window.close();}
});

test('mod değişimi iptal, dönüşüm ve boş giriş yolları',async()=>{
  const app=await launch('/planim');
  try{
    await createProfile(app);await navigate(app.window,app.document.querySelector('nav a[href="#/bugun"]'));
    fill(app,'kcal','1950');app.document.querySelector('#calorie-form').requestSubmit();await until(()=>app.document.querySelector('.status').textContent==='Kısmi');
    app.document.querySelector('[data-mode="entries"]').click();assert.ok(app.document.querySelector('.confirm-box'));
    app.document.querySelector('[data-action="mode-cancel"]').click();assert.equal(app.document.querySelectorAll('.entry-form').length,0);
    app.document.querySelector('[data-mode="entries"]').click();app.document.querySelector('[data-action="mode-preserve"]').click();
    await until(()=>app.document.querySelectorAll('.entry-form').length===1);assert.match(app.document.querySelector('.calorie-value').textContent,/1.950/);
    app.document.querySelector('[data-mode="total"]').click();app.document.querySelector('[data-action="mode-reset"]').click();await until(()=>app.document.querySelector('.status').textContent==='Girilmedi');
    assert.match(app.document.querySelector('.calorie-value').textContent,/—/);assert.equal(app.document.querySelector('[data-action="complete"]').disabled,true);
  }finally{app.dom.window.close();}
});

test('plansız profil kalori/kilo tutabilir; tahmini enerji sonucu uydurulmaz',async()=>{
  const app=await launch('/planim');
  try{
    await createProfile(app,'out-of-scope');assert.match(app.document.querySelector('.plan-summary').textContent,/Plansız/);
    await navigate(app.window,app.document.querySelector('nav a[href="#/kayitlar"]'));
    fill(app,'kcal','1700');app.document.querySelector('#calorie-form').requestSubmit();await until(()=>app.document.querySelector('.status').textContent==='Kısmi');
    app.document.querySelector('[data-action="complete"]').click();await until(()=>app.document.querySelector('.status').textContent==='Tamamlandı');
    assert.match(app.document.querySelector('.record-editor').textContent,/Plan yok; yalnız tüketim/);
    fill(app,'weight-kg','90.5');app.document.querySelector('#weight-form').requestSubmit();await until(()=>app.document.querySelector('.history-list').parentElement.parentElement.textContent.includes('90,5'));
    await navigate(app.window,app.document.querySelector('nav a[href="#/ilerlemem"]'));assert.match(app.document.querySelector('main').textContent,/90,5 kg/);
  }finally{app.dom.window.close();}
});

test('iki arayüzde aynı güne eşzamanlı yazma: ikincisi hata gösterir ve girilen değer korunur',async()=>{
  const factory=new IDBFactory(),a=await launch('/planim',false,factory);let b;
  try{
    await createProfile(a);await navigate(a.window,a.document.querySelector('nav a[href="#/bugun"]'));
    b=await launch('/bugun',false,factory);
    fill(a,'kcal','2000');a.document.querySelector('#calorie-form').requestSubmit();await until(()=>a.document.querySelector('.status').textContent==='Kısmi');
    fill(b,'kcal','2200');b.document.querySelector('#calorie-form').requestSubmit();await until(()=>b.document.querySelector('.error-message'));
    assert.match(b.document.querySelector('.error-message').textContent,/başka bir sekmede/);assert.equal(b.document.querySelector('#kcal').value,'2200');assert.equal(b.document.querySelector('[data-action="retry"]'),null);
    b.document.querySelector('[data-action="reload"]').click();await until(()=>b.document.querySelector('#kcal').value==='2000');
  }finally{a.dom.window.close();b?.dom.window.close();}
});

test('depo erişim hatası görünür ve profil/kalori formu açılmaz',async()=>{
  const factory={open(){throw new DOMException('denied','SecurityError');}},app=await launch('/planim',false,factory);
  try{assert.match(app.document.querySelector('.error-message').textContent,/saklanamadı veya okunamadı/);assert.equal(app.document.querySelector('#profile-form'),null);assert.equal(app.document.querySelector('main').dataset.ready,'false');}
  finally{app.dom.window.close();}
});

test('profil önizlemesinden geri dönmek girilen bilgileri korur',async()=>{
  const app=await launch('/planim');
  try{
    fill(app,'birth-date','2000-08-21');fill(app,'height-cm','180');fill(app,'profile-weight','91');fill(app,'formula-sex','male');fill(app,'pal','1.4');fill(app,'time-zone','Europe/Istanbul');fill(app,'goal','lose');fill(app,'target-weight','80');app.document.querySelector('[name="eligibility"][value="eligible"]').checked=true;
    app.document.querySelector('#profile-form').requestSubmit();assert.ok(app.document.querySelector('.preview-card'));
    app.document.querySelector('[data-action="cancel-profile"]').click();assert.equal(app.document.querySelector('#goal').value,'lose');assert.equal(app.document.querySelector('#target-weight').value,'80');assert.equal(app.document.querySelector('#height-cm').value,'180');
  }finally{app.dom.window.close();}
});

test('yerel gece yarısında açık form korunur; Yeni güne geç gerçekten yeni tarihi açar',async()=>{
  const app=await launch('/planim');
  try{
    await createProfile(app);await navigate(app.window,app.document.querySelector('nav a[href="#/bugun"]'));
    const date=app.document.querySelector('.calorie-editor').dataset.date;
    fill(app,'kcal','1950');
    const NativeDate=app.window.Date,clock=new NativeDate(`${date}T21:00:01Z`);
    app.window.Date=class extends NativeDate { constructor(...args){ super(...(args.length?args:[clock.getTime()])); } static now(){return clock.getTime();} };
    app.document.dispatchEvent(new app.window.Event('visibilitychange'));
    assert.ok(app.document.querySelector('[data-action="new-day"]'));
    assert.equal(app.document.querySelector('#kcal').value,'1950');assert.equal(app.document.querySelector('.calorie-editor').dataset.date,date);
    app.document.querySelector('[data-action="new-day"]').click();
    assert.notEqual(app.document.querySelector('.calorie-editor').dataset.date,date);assert.equal(app.document.querySelector('#kcal').value,'');
  }finally{app.dom.window.close();}
});

test('IndexedDB getter erişim hatası açılışı çökertmez',async()=>{
  const app=await launch('/planim',false,'denied-getter');
  try {assert.deepEqual(app.errors,[]);assert.ok(app.document.querySelector('.error-message'));assert.equal(app.document.querySelector('#profile-form'),null);}finally{app.dom.window.close();}
});
