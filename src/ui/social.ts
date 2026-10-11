import type { SupabaseClient } from "@supabase/supabase-js";
import { art, progressBar } from "./design.ts";
import { icon } from "../icons.ts";
import { escape } from "./tracker.ts";
import type { Tracker } from "./tracker.ts";
import type { WaterTracker } from "./water.ts";
import { IndexedDbRepository } from "../data/indexeddb.ts";
import { CloudRepository } from "../data/cloud.ts";
import { SupabaseRpc, socialClient } from "../social/client.ts";
import { emptySocial } from "../social/types.ts";
import type {
  SocialState,
  Person,
  Sharing,
  Snapshot,
} from "../social/types.ts";
import { remapSnapshot } from "../social/snapshot.ts";
import { uuid, requireValue } from "../domain/tracking.ts";
import { parseLocalDate } from "../domain/dates.ts";
const fields = [
  ["record", "Günlük kayıt durumu"],
  ["calories", "Tam kalori miktarı"],
  ["movement", "Haftalık hareket süresi"],
  ["water", "Su hedefi tamamlandı mı?"],
  ["weight", "Son kilo ölçümü"],
] as const;
const btn = (action: string, label: string, attrs = "", secondary = false) =>
  `<button type="button" class="button ${secondary ? "secondary" : "primary"}" data-social-action="${action}" ${attrs}>${label}</button>`;
const input = (name: string, label: string, value = "", attrs = "") =>
  `<label class="field"><span>${label}</span><input name="${name}" value="${escape(value)}" ${attrs}></label>`;
const form = (name: string, title: string, body: string, submit: string) =>
  `<h2>${title}</h2><form data-social-form="${name}" class="tracking-form">${body}<p class="social-form-error" role="alert"></p><button class="button primary" type="submit">${submit}</button></form>`;
function summary(p: Person) {
  const s = p.summary ?? {};
  return Object.entries(s)
    .map(
      ([key, value]) =>
        `<span class="tag">${key === "record" ? `Kayıt: ${value === "completed" ? "tamamlandı" : value === "partial" ? "kısmi" : "girilmedi"}` : key === "calories" ? `Kalori: ${value ?? "—"} kcal` : key === "movement" ? `7 gün: ${value} dk` : key === "water" ? `Su: ${value ? "hedef tamam" : "henüz tamamlanmadı"}` : `Kilo: ${value ?? "—"} kg`}</span>`,
    )
    .join("");
}
function person(p: Person, body = "") {
  return `<div class="social-person">${art(p.avatar)}<div class="social-person-body"><strong>${escape(p.name)}</strong><small>@${escape(p.username)}</small>${summary(p)}${body}</div></div>`;
}
export class SocialController {
  client: SupabaseClient | null = null;
  rpc: SupabaseRpc | null = null;
  cloud: CloudRepository | null = null;
  state: SocialState = emptySocial();
  userId: string | null = null;
  busy = false;
  ready = false;
  error = "";
  notice = "";
  recovery = false;
  private retryCommand: { signature: string; id: string } | null = null;
  private modal!: (content: string) => HTMLDialogElement;
  private epoch = 0;
  private pendingInvite: string | null = null;
  private disposed = false;
  private listener: ReturnType<
    SupabaseClient["auth"]["onAuthStateChange"]
  > | null = null;
  constructor(
    private tracker: Tracker,
    private water: WaterTracker,
    private render: () => void,
  ) {
    try {
      this.client = socialClient();
      if (this.client) this.rpc = new SupabaseRpc(this.client);
    } catch (e) {
      this.error = (e as Error).message;
    }
  }
  async init() {
    const invite = new URLSearchParams(location.search).get("invite");
    if (invite) this.pendingInvite = invite;
    if (!this.client) {
      this.ready = true;
      await this.tracker.load();
      return;
    }
    this.listener = this.client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") this.recovery = true;
      if (
        event === "SIGNED_OUT" ||
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "PASSWORD_RECOVERY"
      )
        setTimeout(() => {
          if (!this.disposed) void this.session(session?.user.id ?? null);
        }, 0);
    });
    const { data, error } = await this.client.auth.getSession();
    if (error) this.error = "Oturum okunamadı; tekrar giriş yap.";
    await this.session(data.session?.user.id ?? null);
  }
  private async session(id: string | null) {
    if (this.ready && id === this.userId) {
      if (this.recovery) {
        location.hash = "#/sosyal";
        this.render();
      }
      return;
    }
    const epoch = ++this.epoch;
    this.ready = false;
    this.state = emptySocial();
    this.userId = id;
    this.retryCommand = null;
    this.cloud = null;
    this.water.connect(null);
    try {
      if (id && this.rpc && this.client) {
        const { data, error } = await this.client.auth.getUser();
        if (error || data.user?.id !== id)
          throw new Error("Oturum doğrulanamadı; tekrar giriş yap.");
        const cloud = new CloudRepository(this.rpc, id);
        this.cloud = cloud;
        this.tracker.useRepository(cloud, id);
        this.water.connect(cloud);
        await this.reload();
        if (!this.state.account) {
          const m = data.user.user_metadata;
          if (m.username && m.name) {
            try {
              await this.rpc.call(
                "account_save",
                { username: m.username, name: m.name, avatar: "cat" },
                uuid(),
              );
              await this.reload();
            } catch (e) {
              this.error = (e as Error).message;
            }
          }
        }
      } else this.tracker.useRepository(new IndexedDbRepository());
      await this.tracker.load();
      if (epoch !== this.epoch) return;
      this.ready = true;
      if (this.recovery) location.hash = "#/sosyal";
      this.render();
    } catch (e) {
      if (epoch !== this.epoch) return;
      this.error = (e as Error).message;
      this.ready = true;
      this.tracker.ready = false;
      this.render();
    }
  }
  async reload() {
    if (this.rpc && this.userId) {
      const epoch = this.epoch;
      const state = await this.rpc.call<SocialState>("state");
      if (epoch === this.epoch) this.state = state;
    }
  }
  accountLabel() {
    return this.userId
      ? "Hesabında saklanır; diğer cihazlarda aynı hesapla erişebilirsin."
      : "Bu cihazda saklanır; tarayıcı verileriyle birlikte silinebilir.";
  }
  content(): string {
    const head =
      '<header class="page-heading"><h1 id="page-title" tabindex="-1">Sosyal</h1><p>Birlikte ilerlemek daha güzel.</p></header>';
    const message = `<div role="${this.error ? "alert" : "status"}" class="${this.error ? "error-message" : "tracker-notice"}">${escape(this.error || this.notice)}</div>`;
    if (!this.client)
      return `${head}${message}<section class="card">${art("group")}<h2>Arkadaşlarınla ilerle</h2><p>Arkadaşlık, davetli gruplar ve challenge için sunucu bağlantısı henüz yapılandırılmadı.</p><p class="hint">Yerel kayıtların çalışmaya devam eder. Bağlantı kurulunca buradan hesap açabilirsin.</p></section>`;
    if (!this.ready)
      return `${head}<section class="card" aria-busy="true"><p>Hesabın yükleniyor…</p></section>`;
    if (this.recovery)
      return `${head}${message}<section class="card">${form("password", "Yeni şifre", input("password", "Yeni şifre", "", 'type="password" minlength="10" autocomplete="new-password" required'), "Şifreyi güncelle")}</section>`;
    if (!this.userId)
      return `${head}${message}<section class="card auth-card">${art("cat")}<h2>Arkadaşlarınla aynı yolda</h2><p>Bir hesapla kayıtlarını taşı, özel grubuna katıl ve birlikte hedef koy.</p>${this.pendingInvite ? '<p class="tag">Bir davetin var. Girişten sonra katılabilirsin.</p>' : ""}${form("login", "Giriş yap", input("email", "E-posta", "", 'type="email" autocomplete="email" required') + input("password", "Şifre", "", 'type="password" autocomplete="current-password" required'), "Giriş yap")}<details><summary>Yeni hesap oluştur</summary>${form("signup", "Aramıza katıl", input("name", "Görünen ad", "", 'maxlength="40" required') + input("username", "Kullanıcı adı", "", 'pattern="[a-z0-9_]{3,24}" minlength="3" maxlength="24" required autocomplete="username"') + input("email", "E-posta", "", 'type="email" autocomplete="email" required') + input("password", "Şifre", "", 'type="password" minlength="10" autocomplete="new-password" required'), "Hesap oluştur")}</details><details><summary>Şifremi unuttum</summary>${form("reset", "Şifre sıfırlama", input("email", "E-posta", "", 'type="email" required'), "Sıfırlama bağlantısı gönder")}</details></section>`;
    const a = this.state.account;
    if (!a)
      return `${head}${message}<section class="card">${this.profileForm()}${btn("logout", "Çıkış yap", "", true)}</section>`;
    const prefs = a.prefs;
    const unread = this.state.notifications.filter((n) => !n.read).length;
    return `${head}${message}<section class="card"><div class="card-top"><h2>Benim profilim</h2>${btn("refresh", "Yenile", "", true)}</div>${person(a)}<div class="actions">${btn("profile", "Profili düzenle", "", true)}${btn("import", "Cihaz kayıtlarını aktar", "", true)}${btn("logout", "Çıkış yap", "", true)}</div></section>
 ${this.pendingInvite ? `<section class="card"><h2>Davetin var</h2><p>Katılmak için daveti aç; grup daveti üyelik, arkadaş daveti karşı tarafa istek oluşturur.</p>${btn("redeem", "Daveti değerlendir", `data-token="${escape(this.pendingInvite)}"`)}</section>` : ""}
 <section class="card"><h2>Sürecimi paylaş</h2><div class="sharing-row">${art("lock")}<p class="muted">${prefs.enabled ? "Seçtiğin kişiler, yalnız izin verdiğin bilgileri görür." : "Kayıtların paylaşılmıyor."}</p><label class="sharing-switch"><input type="checkbox" role="switch" id="social-sharing" aria-label="Sürecimi paylaş" ${prefs.enabled ? "checked" : ""}><small>${prefs.enabled ? "Açık" : "Kapalı"}</small></label></div><div class="ornate-divider"></div>${btn("privacy", "Kimler, neleri görebilir?", "", true)}</section>
 <section class="card"><div class="card-top"><h2>Arkadaşlarım <small>${this.state.friends.length}</small></h2></div>${this.state.requests.length ? `<h3>Arkadaşlık istekleri</h3>${this.state.requests.map((p) => person(p, `<div class="actions">${p.incoming ? btn("accept", "Kabul et", `data-target="${p.id}"`) : '<span class="tag">Yanıt bekliyor</span>'}${btn("remove", p.incoming ? "Reddet" : "İptal et", `data-target="${p.id}"`, true)}</div>`)).join("")}<div class="ornate-divider"></div>` : ""}${this.state.friends.length ? this.state.friends.map((p) => person(p, `<div class="actions">${btn("support", "Alkış gönder", `data-target="${p.id}"`, true)}${btn("friend", "Seçenekler", `data-target="${p.id}"`, true)}</div>`)).join("") : `<div class="social-empty">${icon("users")}<span>Henüz arkadaşın yok.<small>Kullanıcı adı veya davet bağlantısıyla ekle.</small></span></div>`}<div class="actions">${btn("add", "Arkadaş ekle")}${btn("invite", "Davet bağlantısı", "", true)}</div></section>
 <section class="card"><div class="card-top"><h2>Gruplarım</h2>${btn("group", "Grup kur", "", true)}</div>${this.state.groups.length ? this.state.groups.map((g) => `<button type="button" class="link-row" data-social-action="group-detail" data-group="${g.id}">${art("group")}<span><strong>${escape(g.name)}</strong><small>${g.members.length} görünür üye · ${g.role === "owner" ? "grup sahibi" : g.role === "admin" ? "yönetici" : "üye"}</small></span>${icon("arrow")}</button>`).join("") : '<p class="muted">Davetle katılınan özel grupların burada.</p>'}${btn("redeem", "Davet koduyla katıl", "", true)}</section>
 <section class="card"><div class="card-top"><h2>Challenge’lar</h2>${btn("challenge", "Başlat", "", true)}</div>${
   this.state.challenges.length
     ? this.state.challenges
         .map((c) => {
           const score = c.scores.find((s) => s.id === this.userId);
           return `<button type="button" class="link-row challenge-link" data-social-action="challenge-detail" data-challenge="${c.id}">${art(c.kind === "water" ? "water" : c.kind === "movement" ? "shoe" : "target")}<span><strong>${escape(c.name)}</strong><small>${escape(c.starts)} – ${escape(c.ends)} · ${c.mode === "race" ? "yarışma" : "birlikte"}</small>${score ? progressBar((score.days / score.total) * 100, "Challenge ilerlemesi") : ""}<small>${score ? `${score.days}/${score.total} gün` : "Henüz katılmadın"}${c.final ? " · sonuç kesinleşti" : ""}</small></span>${icon("arrow")}</button>`;
         })
         .join("")
     : '<p class="muted">Grubunda birlikte küçük adımlar atın.</p>'
 }<p class="hint">Manuel kayıtlar esas alınır. Hedefler katılımda sabitlenir; eski gün düzeltmeleri için 2 gün tanınır. Challenge ilerlemen grup üyelerine görünür, diğer kayıtların kendi paylaşım ayarına bağlıdır.</p></section>
 <section class="card"><div class="card-top"><h2>Bildirimler ${unread ? `(${unread})` : ""}</h2>${btn("read", "Okundu işaretle", "", true)}</div>${
   this.state.notifications
     .slice(0, 10)
     .map(
       (n) =>
         `<p class="social-notification ${n.read ? "" : "unread"}">${escape(n.label)}<small>${new Date(n.created_at).toLocaleString("tr-TR")}</small></p>`,
     )
     .join("") || '<p class="muted">Yeni bildirim yok.</p>'
 }</section>${this.state.blocks.length ? `<section class="card"><h2>Engellenenler</h2>${this.state.blocks.map((p) => person(p, btn("unblock", "Engeli kaldır", `data-target="${p.id}"`, true))).join("")}</section>` : ""}`;
  }
  private profileForm() {
    const a = this.state.account;
    return form(
      "profile",
      "Sosyal profilin",
      input("name", "Görünen ad", a?.name ?? "", 'maxlength="40" required') +
        input(
          "username",
          "Kullanıcı adı",
          a?.username ?? "",
          'pattern="[a-z0-9_]{3,24}" minlength="3" maxlength="24" required',
        ) +
        input("bio", "Kısa açıklama", a?.bio ?? "", 'maxlength="160"') +
        `<label class="field"><span>Avatar</span><select name="avatar">${[
          ["cat", "Zilli"],
          ["shoe", "Yürüyüş"],
          ["bike", "Bisiklet"],
          ["water", "Su"],
          ["target", "Hedef"],
        ]
          .map(
            ([v, label]) =>
              `<option value="${v}" ${a?.avatar === v ? "selected" : ""}>${label}</option>`,
          )
          .join("")}</select></label>`,
      "Kaydet",
    );
  }
  bind(modal: (content: string) => HTMLDialogElement) {
    this.modal = modal;
    document
      .querySelectorAll<HTMLElement>("[data-social-action]")
      .forEach((el) => {
        el.onclick = () => void this.action(el);
      });
    document
      .querySelectorAll<HTMLFormElement>("[data-social-form]")
      .forEach((el) => {
        el.onsubmit = (event) => {
          event.preventDefault();
          void this.submit(el);
        };
      });
    const sharing = document.querySelector<HTMLInputElement>("#social-sharing");
    if (sharing)
      sharing.onchange = (event) => {
        const el = event.target as HTMLInputElement;
        el.checked = !el.checked;
        const p = this.state.account!.prefs;
        if (!p.enabled) {
          this.actionView("privacy");
          return;
        }
        void this.command("prefs_save", { ...p, enabled: false });
      };
    if (this.busy)
      document
        .querySelectorAll<HTMLButtonElement>(
          "[data-social-action],[data-social-form] button,#social-sharing",
        )
        .forEach((b) => (b.disabled = true));
  }
  private open(html: string) {
    this.modal(html);
    this.bind(this.modal);
  }
  private actionView(action: string) {
    if (action === "profile") {
      this.open(this.profileForm());
      return;
    }
    if (action === "add") {
      this.open(
        form(
          "friend",
          "Arkadaş ekle",
          input("query", "Kullanıcı adı veya arkadaş kodu", "", "required") +
            `<p class="hint">Kendi arkadaş kodun: <span class="invite-code">${escape(this.state.account?.code)}</span></p>`,
          "İstek gönder",
        ),
      );
      return;
    }
    if (action === "group") {
      this.open(
        form(
          "group",
          "Özel grup kur",
          input("name", "Grup adı", "", 'maxlength="60" required'),
          "Grubu kur",
        ),
      );
      return;
    }
    if (action === "privacy") {
      const p = this.state.account!.prefs;
      this.open(
        form(
          "privacy",
          "Paylaşım izinlerin",
          `<label class="setting-row"><span>Paylaşımı aç</span><input name="enabled" type="checkbox" ${p.enabled ? "checked" : ""}></label><label class="field"><span>Kimler görebilir?</span><select name="audience">${[
            ["friends", "Arkadaşlarım"],
            ["selected", "Seçtiğim arkadaşlar"],
            ["groups", "Seçtiğim gruplar"],
          ]
            .map(
              ([v, l]) =>
                `<option value="${v}" ${p.audience === v ? "selected" : ""}>${l}</option>`,
            )
            .join(
              "",
            )}</select></label><fieldset><legend>Paylaşılacak bilgiler</legend>${fields.map(([v, l]) => `<label class="check-line"><input type="checkbox" name="fields" value="${v}" ${p.fields.includes(v) ? "checked" : ""}>${l}</label>`).join("")}</fieldset><fieldset><legend>Seçilecek arkadaşlar</legend>${this.state.friends.map((v) => `<label class="check-line"><input type="checkbox" name="people" value="${v.id}" ${p.ids.includes(v.id) ? "checked" : ""}>${escape(v.name)}</label>`).join("") || "<p>Henüz arkadaş yok.</p>"}</fieldset><fieldset><legend>Seçilecek gruplar</legend>${this.state.groups.map((v) => `<label class="check-line"><input type="checkbox" name="groups" value="${v.id}" ${p.ids.includes(v.id) ? "checked" : ""}>${escape(v.name)}</label>`).join("") || "<p>Henüz grup yok.</p>"}</fieldset><p class="hint">Kapattığında yeni erişimler sunucuda kesilir. Daha önce başka birinin gördüğü veya ekran görüntüsü aldığı bilgiler geri alınamaz.</p>`,
          "İzinleri kaydet",
        ),
      );
      return;
    }
    if (action === "challenge") {
      if (!this.state.groups.length) {
        this.open(
          "<h2>Önce bir grup</h2><p>Challenge başlatmak için özel grup kur veya davetle katıl.</p>",
        );
        return;
      }
      const today = this.tracker.today();
      this.open(
        form(
          "challenge",
          "Challenge başlat",
          input("name", "Challenge adı", "", 'maxlength="60" required') +
            `<label class="field"><span>Grup</span><select name="groupId">${this.state.groups.map((g) => `<option value="${g.id}">${escape(g.name)}</option>`).join("")}</select></label><label class="field"><span>Hedef türü</span><select name="kind"><option value="record">Günlük kaydını tamamla</option><option value="movement">Günlük hareket</option><option value="water">Kişisel su hedefi</option></select></label><label class="field"><span>Tür</span><select name="mode"><option value="together">Birlikte tamamlama</option><option value="race">Tamamlanan gün sıralaması</option></select></label>` +
            input("starts", "Başlangıç", today, 'type="date" required') +
            input(
              "duration",
              "Süre (gün)",
              "7",
              'type="number" min="1" max="30" required',
            ) +
            input(
              "target",
              "Hareket hedefi (dk; hareket türünde)",
              "20",
              'type="number" min="1" max="180" required',
            ) +
            '<p class="hint">Katılımcılar ayrı ayrı katılır. Su hedefi katılım anındaki kişisel hedeftir. Challenge ilerlemesi grup üyelerine görünür.</p>',
          "Oluştur",
        ),
      );
      return;
    }
    if (action === "redeem")
      this.open(
        form(
          "redeem",
          "Davete katıl",
          input(
            "token",
            "Davet kodu veya bağlantısı",
            this.pendingInvite ?? "",
            "required",
          ) +
            '<p class="hint">Grup daveti özel gruba katılmanı sağlar. Arkadaş daveti, bağlantıyı oluşturan kişiye kabul etmesi için arkadaşlık isteği gönderir.</p>',
          "Davete katıl",
        ),
      );
  }
  private async action(el: HTMLElement) {
    if (this.busy || this.tracker.busy) return;
    const a = el.dataset.socialAction!,
      target = el.dataset.target,
      groupId = el.dataset.group,
      challengeId = el.dataset.challenge;
    if (
      ["profile", "add", "group", "privacy", "challenge", "redeem"].includes(a)
    ) {
      this.actionView(a);
      return;
    }
    if (a === "friend") {
      this.open(
        `<h2>Arkadaş seçenekleri</h2><p>Arkadaşlıktan çıkarınca arkadaşlara açık kayıt erişimi kesilir. Engelleme, ortak gruplarda da birbirinizin kayıtlarını ve challenge sonuçlarını görmeyi engeller.</p>${btn("remove", "Arkadaşlıktan çıkar", `data-target="${target}"`, true)}${btn("block", "Engelle", `data-target="${target}"`, true)}`,
      );
      return;
    }
    if (a === "group-detail") {
      const g = this.state.groups.find((x) => x.id === groupId)!;
      this.open(
        `<h2>${escape(g.name)}</h2><p class="hint">Özel grup · ${escape(g.zone)}</p>${g.members.map((p) => person(p, p.id !== this.userId ? `<div class="actions">${btn("block", "Engelle", `data-target="${p.id}"`, true)}${g.role === "owner" || (g.role === "admin" && p.role === "member") ? btn("member-remove", "Üyeyi çıkar", `data-group="${g.id}" data-target="${p.id}"`, true) : ""}${g.role === "owner" && p.role !== "owner" ? btn("role", p.role === "admin" ? "Üye yap" : "Yönetici yap", `data-group="${g.id}" data-target="${p.id}" data-role="${p.role === "admin" ? "member" : "admin"}"`, true) + btn("role", "Sahipliği devret", `data-group="${g.id}" data-target="${p.id}" data-role="owner"`, true) : ""}</div>` : "")).join("")}<div class="actions">${g.role !== "member" ? btn("invite", "Grup daveti oluştur", `data-group="${g.id}"`) : ""}${g.role !== "owner" ? btn("leave", "Gruptan ayrıl", `data-group="${g.id}"`, true) : ""}</div><h3>Aktif davetlerin</h3>${
          this.state.invites
            .filter((i) => i.groupId === g.id)
            .map(
              (i) =>
                `<p>${i.uses}/${i.maxUses} katılım · ${new Date(i.expiresAt).toLocaleDateString("tr-TR")}${btn("revoke", "Daveti iptal et", `data-id="${i.id}"`, true)}</p>`,
            )
            .join("") || "<p>Aktif davetin yok.</p>"
        }`,
      );
      return;
    }
    if (a === "challenge-detail") {
      const c = this.state.challenges.find((x) => x.id === challengeId)!;
      const scores =
        c.mode === "race"
          ? [...c.scores].sort((a, b) => b.days / b.total - a.days / a.total)
          : c.scores;
      this.open(
        `<h2>${escape(c.name)}</h2><p>${escape(c.starts)} – ${escape(c.ends)} · ${escape(c.zone)}</p><p>${c.kind === "water" ? "Katılımdaki kişisel su hedefin" : c.kind === "movement" ? `${c.target} dk günlük hareket` : "Günlük kaydını tamamla"} · ${c.mode === "race" ? "tamamlanan gün sıralaması" : "birlikte tamamlama"}</p>${scores.map((s) => person(s, `${progressBar((s.days / s.total) * 100, "Tamamlanan günler")}<p>${s.days}/${s.total} gün · %${Math.round((s.days / s.total) * 100)}</p>`)).join("") || "<p>Henüz katılımcı yok.</p>"}${!c.joined && c.joinOpen ? `<p class="hint">Katılırsan tamamlanan gün sayın ve hedefin grupta görünür. Diğer kayıtların kendi paylaşım ayarına bağlıdır.</p>${btn("join", "Challenge’a katıl", `data-challenge="${c.id}"`)}` : !c.joined ? "<p>Katılım süresi doldu.</p>" : ""}<p class="hint">${c.final ? "Sonuçlar kesinleşti." : "Son günün ardından 2 gün düzeltme süresi vardır."}</p>`,
      );
      return;
    }
    if (a === "import") {
      await this.importView();
      return;
    }
    if (a === "invite") {
      await this.command(
        "invite_create",
        { groupId: groupId ?? null },
        async (data) => {
          const r = data as { token: string; expiresAt: string; id: string };
          const link = new URL(location.pathname, location.origin);
          link.searchParams.set("invite", r.token);
          link.hash = "/sosyal";
          this.open(
            `<h2>Davetin hazır</h2><p>7 gün geçerli · ${groupId ? "en fazla 20 katılım" : "tek arkadaşlık isteği"}</p><label class="field"><span>Davet bağlantısı</span><input class="invite-code" value="${escape(link.href)}" readonly></label><label class="field"><span>Davet kodu</span><input class="invite-code" value="${r.token}" readonly></label>${btn("copy", "Bağlantıyı kopyala", `data-link="${escape(link.href)}"`, true)}${btn("revoke", "Daveti iptal et", `data-id="${r.id}"`, true)}`,
          );
        },
      );
      return;
    }
    if (a === "copy") {
      try {
        await navigator.clipboard.writeText(el.dataset.link!);
        el.textContent = "Kopyalandı";
      } catch {
        el.textContent = "Bağlantıyı seçip kopyala";
      }
      return;
    }
    if (a === "logout") {
      await this.authTask(async () => {
        const { error } = await this.client!.auth.signOut();
        if (error) throw error;
      });
      return;
    }
    if (a === "refresh") {
      await this.command(null, {}, async () => {
        await this.tracker.load();
      });
      return;
    }
    const actions: Record<string, string> = {
      accept: "friend_accept",
      remove: "friend_remove",
      block: "block",
      unblock: "unblock",
      support: "support",
      read: "notifications_read",
      leave: "group_leave",
      "member-remove": "member_remove",
      role: "member_role",
      revoke: "invite_revoke",
      join: "challenge_join",
    };
    if (actions[a])
      await this.command(actions[a]!, {
        target,
        groupId,
        challengeId,
        role: el.dataset.role,
        id: el.dataset.id,
      });
  }
  private async importView() {
    if (!this.cloud) return;
    try {
      const local = new IndexedDbRepository();
      const profile = requireValue(await local.getLocalProfile());
      if (!profile) {
        this.open(
          "<h2>Aktarılacak kayıt yok</h2><p>Bu cihazda yerel profil bulunmadı.</p>",
        );
        return;
      }
      if (this.cloud.data.profile) {
        this.open(
          "<h2>Hesabında kayıt var</h2><p>Yerel kayıtları mevcut hesabınla otomatik birleştiremeyiz. Her iki kayıt kümesi korunuyor.</p>",
        );
        return;
      }
      const [plans, days, activities, weights, catPreferences] =
        await Promise.all([
          local.listPlans(profile.userId),
          local.listDays(
            profile.userId,
            parseLocalDate("1900-01-01"),
            parseLocalDate("9999-12-31"),
          ),
          local.listAllActivities(profile.userId),
          local.listWeights(profile.userId),
          local.getCatPreferences(profile.userId),
        ]);
      const source: Snapshot = {
        profile,
        plans: requireValue(plans),
        days: requireValue(days),
        activities: requireValue(activities),
        weights: requireValue(weights),
        catPreferences: requireValue(catPreferences),
        water: this.water.readLocal(profile.userId),
      };
      const dialog = this.modal(
        `<h2>Cihaz kayıtlarını hesabına aktar</h2><p>${source.days.length} gün, ${source.activities.length} hareket, ${source.weights.length} kilo ölçümü ve su kayıtları bu hesaba aktarılacak.</p><p>Bu verilerin sana ait olduğunu doğrula. Yerel kopya silinmez; paylaşım izinlerin ayrı kalır.</p><button type="button" class="button primary" id="confirm-social-import">Bana ait, hesabıma aktar</button><p class="social-form-error" role="alert"></p>`,
      );
      dialog.querySelector("#confirm-social-import")!.addEventListener(
        "click",
        () =>
          void this.command(null, {}, async () => {
            await this.cloud!.importData(remapSnapshot(source, this.userId!));
            await this.tracker.load();
            this.notice = "Yerel kayıtların hesabına aktarıldı.";
          }),
      );
    } catch (e) {
      this.error = (e as Error).message;
      this.render();
    }
  }
  private async submit(el: HTMLFormElement) {
    if (this.busy || this.tracker.busy) return;
    const data = new FormData(el),
      name = el.dataset.socialForm!,
      s = (k: string) => String(data.get(k) ?? "").trim();
    if (["login", "signup", "reset", "password"].includes(name)) {
      await this.authTask(async () => {
        let error;
        if (name === "login")
          ({ error } = await this.client!.auth.signInWithPassword({
            email: s("email"),
            password: String(data.get("password")),
          }));
        if (name === "signup") {
          const r = await this.client!.auth.signUp({
            email: s("email"),
            password: String(data.get("password")),
            options: {
              emailRedirectTo: location.origin + location.pathname,
              data: { username: s("username"), name: s("name") },
            },
          });
          error = r.error;
          if (!error && !r.data.session)
            this.notice =
              "Hesabını açmak için e-postandaki doğrulama bağlantısına git.";
        }
        if (name === "reset") {
          ({ error } = await this.client!.auth.resetPasswordForEmail(
            s("email"),
            { redirectTo: location.origin + location.pathname },
          ));
          if (!error)
            this.notice = "Hesabın varsa şifre sıfırlama e-postası gönderildi.";
        }
        if (name === "password") {
          ({ error } = await this.client!.auth.updateUser({
            password: String(data.get("password")),
          }));
          if (!error) {
            this.recovery = false;
            this.notice = "Şifren güncellendi.";
          }
        }
        if (error) throw error;
      }, el);
      return;
    }
    let action = "",
      payload: unknown = {};
    if (name === "profile") {
      action = "account_save";
      payload = {
        username: s("username"),
        name: s("name"),
        bio: s("bio"),
        avatar: s("avatar"),
      };
    }
    if (name === "friend") {
      action = "friend_request";
      payload = { query: s("query").replace(/^@/, "") };
    }
    if (name === "group") {
      action = "group_create";
      payload = {
        name: s("name"),
        zone:
          this.tracker.profile?.timeZone ??
          Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    if (name === "privacy") {
      action = "prefs_save";
      const audience = s("audience");
      payload = {
        enabled: data.has("enabled"),
        audience,
        fields: data.getAll("fields"),
        ids:
          audience === "selected"
            ? data.getAll("people")
            : audience === "groups"
              ? data.getAll("groups")
              : [],
      };
    }
    if (name === "challenge") {
      action = "challenge_create";
      payload = {
        name: s("name"),
        groupId: s("groupId"),
        kind: s("kind"),
        mode: s("mode"),
        starts: s("starts"),
        duration: Number(s("duration")),
        target: Number(s("target")),
      };
    }
    if (name === "redeem") {
      action = "invite_redeem";
      let token = s("token");
      try {
        token = new URL(token).searchParams.get("invite") ?? token;
      } catch {}
      payload = { token };
    }
    await this.command(
      action,
      payload,
      async () => {
        if (name === "redeem") {
          this.pendingInvite = null;
          history.replaceState(null, "", location.pathname + "#/sosyal");
        }
        if (name === "profile" && !this.tracker.ready)
          await this.tracker.load();
      },
      el,
    );
  }
  private async command(
    action: string | null,
    payload: unknown,
    after?: (data: unknown) => Promise<void>,
    formEl?: HTMLFormElement,
  ) {
    if (this.busy || !this.rpc) return;
    this.busy = true;
    this.error = "";
    let completed = false;
    const buttons = Array.from(
      (formEl ?? document).querySelectorAll<HTMLButtonElement>(
        "[data-social-action],[data-social-form] button, #confirm-social-import",
      ),
    );
    buttons.forEach((b) => (b.disabled = true));
    try {
      const signature = JSON.stringify({ action, payload });
      if (!this.retryCommand || this.retryCommand.signature !== signature)
        this.retryCommand = { signature, id: uuid() };
      const data = action
        ? await this.rpc.call(action, payload, this.retryCommand.id)
        : {};
      this.retryCommand = null;
      await this.reload();
      this.notice = "Kaydedildi.";
      if (after && action !== "invite_create") await after(data);
      this.busy = false;
      completed = true;
      document.querySelector<HTMLDialogElement>("#app-dialog")?.close?.();
      this.render();
      if (after && action === "invite_create") await after(data);
    } catch (e) {
      this.error = (e as Error).message;
      const err = (
        formEl ?? document.querySelector("#app-dialog")
      )?.querySelector(".social-form-error");
      if (err) err.textContent = this.error;
      else this.render();
    } finally {
      this.busy = false;
      buttons.forEach((b) => (b.disabled = false));
      if (!completed && !formEl) this.render();
    }
  }
  private async authTask(task: () => Promise<void>, formEl?: HTMLFormElement) {
    if (this.busy) return;
    this.busy = true;
    this.error = "";
    formEl
      ?.querySelectorAll<HTMLButtonElement>("button")
      .forEach((b) => (b.disabled = true));
    try {
      await task();
      if (!this.userId && !this.recovery) this.render();
    } catch (e) {
      this.error = (e as Error).message;
      const err = formEl?.querySelector(".social-form-error");
      if (err) err.textContent = this.error;
      else this.render();
    } finally {
      this.busy = false;
      formEl
        ?.querySelectorAll<HTMLButtonElement>("button")
        .forEach((b) => (b.disabled = false));
      if (!this.error) this.render();
    }
  }
  dispose() {
    this.disposed = true;
    this.listener?.data.subscription.unsubscribe();
  }
}
