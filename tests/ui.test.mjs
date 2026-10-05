import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
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
function launch(hash = "/bugun", reducedMotion = false) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: `https://example.test/#${hash}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole,
  });
  dom.window.matchMedia = () => ({ matches: reducedMotion });
  dom.window.scrollTo = () => {};
  dom.window.eval(script);
  return { dom, window: dom.window, document: dom.window.document, errors };
}
async function navigate(window, link) {
  await new Promise((resolve) => {
    window.addEventListener("hashchange", resolve, { once: true });
    link.click();
  });
}
test("beş ekran arasında gerçek linklerle geçiş ve başlık odağı", async () => {
  const app = launch();
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
test("boş gün sıfır kalori veya uydurma kişisel hedef göstermez", () => {
  const app = launch();
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
    assert.equal(app.document.querySelector("button").disabled, true);
    assert.match(
      app.document.querySelector(".scene-caption").textContent,
      /Raund 4/,
    );
    assert.deepEqual(app.errors, []);
  } finally {
    app.dom.window.close();
  }
});
test("yanlış rota güvenli başlangıca döner", () => {
  const app = launch("/olmayan-ekran");
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
  const app = launch("/ayarlar", true);
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
test("içeriğe geç bağlantısı ve semantik navigasyon mevcut", () => {
  const app = launch();
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
