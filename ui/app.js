"use strict";

/* ---------- Tauri bridge (with a tiny mock so the UI can be previewed in a browser) ---------- */
const T = window.__TAURI__;
const invoke = T ? T.core.invoke : mockInvoke;
const makeChannel = (fn) => {
  if (T) { const c = new T.core.Channel(); c.onmessage = fn; return c; }
  return { onmessage: fn };
};
const appWindow = T ? T.window.getCurrentWindow() : null;

/* ---------- icons ---------- */
const I = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
  term: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 4 4-4 4M12 16h7"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/></svg>',
  power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v9"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/></svg>',
  redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2.5" width="8" height="4" rx="1.2"/><path d="M16 4.5h1.5a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2H8"/><path d="M9 12h6M9 16h4"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/></svg>',
  paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2.5" width="8" height="4" rx="1.2"/><path d="M16 4.5h1.5a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2H8"/><path d="M12 10v7M9 14l3 3 3-3"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v4.5M8.5 3.5h7l-1 6 3 3.5h-11l3-3.5z"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/><path d="m14.5 5.5 3 3"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  pinOff: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v4.5" fill="none"/><path d="M8.5 3.5h7l-1 6 3 3.5h-11l3-3.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13"/></svg>',
  selectAll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/></svg>',
  eraser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-3.5-3.5a1.5 1.5 0 0 1 0-2.1L14 4.9a1.5 1.5 0 0 1 2.1 0l4 4a1.5 1.5 0 0 1 0 2.1L10 21zM21 21H10M8.5 10.5l5 5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  solid: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>',
  clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"><circle cx="12" cy="12" r="8"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8v5M12 16.5h.01"/><circle cx="12" cy="12" r="9"/></svg>',
};

const COLORS = ["#0a84ff", "#5ac8fa", "#30d158", "#ffd60a", "#ff9f0a", "#ff453a", "#ff375f", "#bf5af2"];
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, attrs = {}, html = "") => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  if (html) el.innerHTML = html;
  return el;
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const initials = (n) => (n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
/** what goes inside an .avatar: the host's custom image, or its initials */
const face = (host) => (host.icon && host.icon.startsWith("data:image/") ? `<img src="${esc(host.icon)}" alt="">` : esc(initials(host.name)));

/* ---------- state ---------- */
let hosts = [];
const probes = new Map(); // hostId -> ms | null
const sessions = new Map(); // sid -> session
let activeSid = null;

/* ---------- window chrome ---------- */
document.querySelectorAll("[data-win]").forEach((b) =>
  b.addEventListener("click", () => {
    if (!appWindow) return;
    const a = b.dataset.win;
    if (a === "close") appWindow.close();
    else if (a === "min") appWindow.minimize();
    else appWindow.toggleMaximize();
  })
);
// square corners when maximized, rounded otherwise
const syncMax = async () => {
  if (!appWindow) return;
  const max = await appWindow.isMaximized();
  document.body.classList.toggle("max", max);
  $('[data-win="max"]').title = max ? "Restaurar" : "Maximizar";
};
window.addEventListener("resize", syncMax);
syncMax();
window.addEventListener("blur",() => document.body.classList.add("blurred"));
window.addEventListener("focus", () => document.body.classList.remove("blurred"));

$("#addHost").innerHTML = I.plus;
$(".search-ico").innerHTML = I.search;
$(".empty-badge").innerHTML = I.term;
$("#addHost").onclick = () => openEditor();
$("#search").oninput = renderHosts;

/* ---------- hosts ---------- */
async function loadHosts() {
  hosts = await invoke("list_hosts");
  renderHosts();
  if ($("#prefs").classList.contains("on")) renderIconList();
  probeAll();
}

function sessionCount(hostId) {
  let n = 0;
  for (const s of sessions.values()) if (s.hostId === hostId && s.state !== "closed" && s.state !== "error") n++;
  return n;
}

function renderHosts() {
  const q = $("#search").value.trim().toLowerCase();
  const list = $("#hostList");
  list.innerHTML = "";
  const activeHost = sessions.get(activeSid)?.hostId;
  for (const host of hosts) {
    if (q && !`${host.name} ${host.host} ${host.user}`.toLowerCase().includes(q)) continue;
    const p = probes.get(host.id);
    const n = sessionCount(host.id);
    const el = h("div", { class: "host" + (host.id === activeHost ? " active" : ""), title: "Clique para conectar" }, `
      <div class="avatar" style="--c:${esc(host.color)}">${face(host)}<span class="dot ${p === undefined ? "" : p === null ? "off" : "on"}"></span></div>
      <div class="host-meta">
        <div class="host-name">${esc(host.name)}</div>
        <div class="host-sub">${esc(host.user ? host.user + "@" : "")}${esc(host.host)}${host.port !== 22 ? ":" + host.port : ""}</div>
      </div>
      ${n ? `<span class="count">${n}</span>` : ""}
      <button class="icon-btn edit" title="Editar">${I.dots}</button>`);
    el.onclick = (e) => {
      if (e.target.closest(".edit")) return openEditor(host);
      openSessionFor(host);
    };
    list.append(el);
  }
  if (!list.children.length) list.append(h("div", { class: "hint", style: "padding:12px 8px" }, hosts.length ? "Nada encontrado." : "Nenhuma máquina ainda."));

  const online = [...probes.values()].filter((v) => v != null).length;
  $("#footInfo").textContent = `${hosts.length} máquina${hosts.length === 1 ? "" : "s"} · ${online} online`;
  renderQuick();
}

function renderQuick() {
  const q = $("#quick");
  q.innerHTML = "";
  for (const host of hosts.slice(0, 6)) {
    const p = probes.get(host.id);
    const c = h("button", { class: "qcard" }, `
      <div class="avatar" style="--c:${esc(host.color)}">${face(host)}<span class="dot ${p === undefined ? "" : p === null ? "off" : "on"}"></span></div>
      <div class="host-meta"><div class="host-name">${esc(host.name)}</div><div class="host-sub">${esc(host.host)}${p != null ? " · " + p + " ms" : ""}</div></div>`);
    c.onclick = () => openSessionFor(host);
    q.append(c);
  }
  const add = h("button", { class: "qcard", style: "min-width:auto" }, `<div class="avatar" style="--c:#3a3a44">${I.plus}</div><div class="host-name" style="padding-right:4px">Adicionar</div>`);
  add.onclick = () => openEditor();
  q.append(add);
}

async function probeAll() {
  if (document.hidden) return;
  await Promise.all(hosts.map(async (host) => probes.set(host.id, await invoke("probe", { host: host.host, port: host.port }))));
  renderHosts();
  for (const s of sessions.values()) updateBar(s);
}
setInterval(probeAll, 20000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) probeAll(); });

/* ---------- editor sheet ---------- */
function openSheet(html, onMount) {
  const sheet = $("#sheet");
  sheet.innerHTML = html;
  $("#scrim").classList.add("on");
  sheet.classList.add("on");
  onMount?.(sheet);
  setTimeout(() => sheet.querySelector("[autofocus]")?.focus(), 60);
}
function closeSheet() {
  $("#sheet").classList.remove("on");
  $("#scrim").classList.remove("on");
  sheetCancel?.();
  sheetCancel = null;
  sessions.get(activeSid)?.term.focus();
}
let sheetCancel = null;
$("#scrim").onclick = closeSheet;

function openEditor(host, opts = {}) {
  const isNew = !host;
  const v = host || { name: "", host: "", port: 22, user: "", auth: "password", keyPath: "", color: COLORS[hosts.length % COLORS.length], hasSecret: false };
  let auth = v.auth, color = v.color, clearSecret = false;
  openSheet(`
    <h2>${isNew ? "Nova máquina" : "Editar máquina"}</h2>
    <p class="lead">${opts.lead || "Os dados ficam só neste PC; senhas são cifradas pelo Windows."}</p>
    <div class="form">
      <label class="field"><span>Nome</span><input class="input" id="f-name" placeholder="Fedora Server" value="${esc(v.name)}" ${isNew ? "autofocus" : ""}></label>
      <div class="row">
        <label class="field"><span>Endereço</span><input class="input mono" id="f-host" placeholder="192.168.0.10" value="${esc(v.host)}" spellcheck="false"></label>
        <label class="field"><span>Porta</span><input class="input mono" id="f-port" type="number" min="1" max="65535" value="${v.port}"></label>
      </div>
      <label class="field"><span>Usuário</span><input class="input mono" id="f-user" placeholder="root" value="${esc(v.user)}" spellcheck="false" ${opts.focusUser ? "autofocus" : ""}></label>
      <div class="field"><span>Autenticação</span><div class="seg" id="f-auth"><button data-v="password">Senha</button><button data-v="key">Chave SSH</button></div></div>
      <label class="field" id="f-pw-wrap"><span>Senha ${v.hasSecret ? "<em class='hint'>(salva — deixe vazio para manter)</em>" : "<em class='hint'>(opcional — pergunto ao conectar)</em>"}</span><input class="input" id="f-secret" type="password" placeholder="••••••••"></label>
      <label class="field" id="f-key-wrap"><span>Arquivo da chave privada</span><input class="input mono" id="f-key" placeholder="~/.ssh/id_ed25519" value="${esc(v.keyPath)}" spellcheck="false"></label>
      ${v.hasSecret ? `<label class="check" id="f-clear"><span class="toggle"></span>Esquecer senha salva</label>` : ""}
      <div class="field"><span>Cor</span><div class="swatches" id="f-colors">${COLORS.map((c) => `<button class="sw" style="--c:${c}" data-c="${c}"></button>`).join("")}</div></div>
      <div class="err" id="f-err"></div>
    </div>
    <div class="actions">
      ${isNew ? "" : `<button class="btn danger" id="f-del">Remover</button>`}
      <span class="grow"></span>
      <button class="btn" id="f-cancel">Cancelar</button>
      <button class="btn primary" id="f-save">${opts.saveLabel || (isNew ? "Adicionar" : "Salvar")}</button>
    </div>`, (s) => {
    const syncAuth = () => {
      s.querySelectorAll("#f-auth button").forEach((b) => b.classList.toggle("on", b.dataset.v === auth));
      $("#f-key-wrap", s).hidden = auth !== "key";
      $("#f-pw-wrap span", s).firstChild.textContent = auth === "key" ? "Senha da chave " : "Senha ";
    };
    const syncColor = () => s.querySelectorAll(".sw").forEach((b) => b.classList.toggle("on", b.dataset.c === color));
    s.querySelectorAll("#f-auth button").forEach((b) => (b.onclick = () => { auth = b.dataset.v; syncAuth(); }));
    s.querySelectorAll(".sw").forEach((b) => (b.onclick = () => { color = b.dataset.c; syncColor(); }));
    const clr = $("#f-clear", s);
    if (clr) clr.onclick = () => { clearSecret = !clearSecret; clr.firstChild.classList.toggle("on", clearSecret); };
    syncAuth(); syncColor();

    $("#f-cancel", s).onclick = closeSheet;
    if (!isNew) $("#f-del", s).onclick = async () => {
      if ($("#f-del", s).dataset.armed) {
        await invoke("delete_host", { id: v.id });
        probes.delete(v.id);
        closeSheet();
        await loadHosts();
        toast(`“${v.name}” removida`);
      } else {
        $("#f-del", s).dataset.armed = "1";
        $("#f-del", s).textContent = "Confirmar remoção";
      }
    };
    const save = async () => {
      const input = {
        id: v.id || null,
        name: $("#f-name", s).value,
        host: $("#f-host", s).value,
        port: parseInt($("#f-port", s).value, 10) || 22,
        user: $("#f-user", s).value,
        auth,
        keyPath: $("#f-key", s).value,
        color,
        secret: $("#f-secret", s).value || null,
        clearSecret,
      };
      try {
        const saved = await invoke("save_host", { input });
        sheetCancel = null;
        closeSheet();
        await loadHosts();
        opts.after?.(saved);
      } catch (e) {
        $("#f-err", s).textContent = String(e);
      }
    };
    $("#f-save", s).onclick = save;
    s.onkeydown = (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") save(); };
  });
}

/* ---------- sessions ---------- */
const THEME = {
  background: "rgba(0,0,0,0)",
  foreground: "#e6e8ef",
  cursor: "#ffffff",
  cursorAccent: "#0c0e14",
  selectionBackground: "rgba(10,132,255,0.35)",
  black: "#1c1e26", red: "#ff6b6b", green: "#5be37d", yellow: "#ffd866", blue: "#5aa9ff", magenta: "#c792ea", cyan: "#6ee7f7", white: "#d7dae0",
  brightBlack: "#5c6370", brightRed: "#ff8787", brightGreen: "#7ef29a", brightYellow: "#ffe08a", brightBlue: "#82c0ff", brightMagenta: "#dcaaff", brightCyan: "#9af2fb", brightWhite: "#ffffff",
};

function openSessionFor(host) {
  if (!host.user) {
    return openEditor(host, {
      lead: "Só falta o usuário para conectar.",
      focusUser: true,
      saveLabel: "Salvar e conectar",
      after: (saved) => openSessionFor(saved),
    });
  }
  // Reuse an existing live tab for this host if one is active; otherwise open a new one.
  const sid = crypto.randomUUID().replace(/-/g, "");
  const s = createSession(sid, host);
  activate(sid);
  startConnect(s);
}

function createSession(sid, host) {
  const pane = h("div", { class: "pane" }, `
    <div class="pane-bar">
      <div class="avatar" data-r="face" style="--c:${esc(host.color)};width:26px;height:26px;border-radius:8px;font-size:11px">${face(host)}</div>
      <div><div class="pane-title">${esc(host.name)}</div></div>
      <span class="pane-sub">${esc(host.user)}@${esc(host.host)}</span>
      <span class="chip" data-r="chip"><i></i><span></span></span>
      <span class="grow"></span>
      <button class="pbtn" data-r="key" title="Gera uma chave e instala no servidor: próximas conexões sem senha">${I.key}Login sem senha</button>
      <button class="pbtn" data-r="re" title="Reconectar">${I.redo}</button>
      <button class="pbtn" data-r="off" title="Desconectar">${I.power}</button>
    </div>
    <div class="term"></div>
    <div class="overlay" hidden></div>`);
  $("#stage").append(pane);

  const term = new Terminal({
    fontFamily: termFont(),
    fontSize: prefs.size,
    lineHeight: 1.2,
    cursorBlink: true,
    cursorStyle: "bar",
    allowTransparency: true,
    scrollback: 4000,
    theme: termTheme(),
    macOptionIsMeta: true,
    rightClickSelectsWord: false,
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.loadAddon(new WebLinksAddon.WebLinksAddon());
  term.open($(".term", pane));

  const s = { sid, hostId: host.id, host, term, fit, pane, state: "idle", tab: null, scheme: schemeOf().name };
  sessions.set(sid, s);

  // keyboard, Windows Terminal style:
  //   Ctrl+C copies when there is a selection (otherwise it's SIGINT), Ctrl+Shift+C / Ctrl+Insert copy,
  //   Ctrl+V / Shift+Insert paste, Ctrl+Shift+V opens the in-app clipboard
  term.attachCustomKeyEventHandler((e) => {
    if (e.type !== "keydown") return true;
    const k = e.key.toLowerCase();
    const stop = () => { e.preventDefault(); return false; };
    if (e.ctrlKey && e.shiftKey && k === "v") { toggleClip(); return stop(); }
    if (e.ctrlKey && k === ",") { togglePrefs(); return stop(); }
    if (e.ctrlKey && k === "c" && (e.shiftKey || term.hasSelection())) { copySel(s); return stop(); }
    if (e.ctrlKey && k === "insert") { copySel(s); return stop(); }
    if ((e.ctrlKey && k === "v") || (e.shiftKey && k === "insert")) { paste(s); return stop(); }
    if (e.ctrlKey && e.shiftKey && k === "a") { term.selectAll(); return stop(); }
    if (e.ctrlKey && e.shiftKey && k === "w") { closeSession(sid); return stop(); }
    if (e.ctrlKey && k === "tab") { cycle(e.shiftKey ? -1 : 1); return stop(); }
    return true;
  });
  $(".term", pane).addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openTermMenu(s, e.clientX, e.clientY);
  });

  term.onData((d) => { if (s.state === "connected") invoke("write", { sessionId: s.sid, data: d }); });
  term.onResize(({ cols, rows }) => { if (s.state === "connected") invoke("resize", { sessionId: s.sid, cols, rows }); });

  let raf = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { if (!pane.hidden) try { fit.fit(); } catch {} });
  }).observe($(".term", pane));

  $('[data-r="off"]', pane).onclick = () => invoke("disconnect", { sessionId: s.sid });
  $('[data-r="re"]', pane).onclick = () => reconnect(s);
  $('[data-r="key"]', pane).onclick = () => installKey(s);

  // tab
  const tab = h("div", { class: "tab", style: `--c:${host.color}` }, `<span class="tdot"></span><span class="tname">${esc(host.name)}</span><button class="x" title="Fechar (Ctrl+Shift+W)">${I.x}</button>`);
  tab.onclick = (e) => (e.target.closest(".x") ? closeSession(s.sid) : activate(s.sid));
  tab.onauxclick = (e) => { if (e.button === 1) closeSession(s.sid); };
  $("#tabs").append(tab);
  s.tab = tab;
  return s;
}

function activate(sid) {
  activeSid = sid;
  for (const s of sessions.values()) {
    const on = s.sid === sid;
    s.pane.hidden = !on;
    s.tab.classList.toggle("active", on);
  }
  $("#empty").hidden = sessions.size > 0;
  const s = sessions.get(sid);
  if (s) requestAnimationFrame(() => { try { s.fit.fit(); } catch {} s.term.focus(); });
  renderHosts();
}

function cycle(dir) {
  const ids = [...sessions.keys()];
  if (ids.length < 2) return;
  activate(ids[(ids.indexOf(activeSid) + dir + ids.length) % ids.length]);
}

function closeSession(sid) {
  const s = sessions.get(sid);
  if (!s) return;
  invoke("disconnect", { sessionId: s.sid });
  s.term.dispose();
  s.pane.remove();
  s.tab.remove();
  sessions.delete(sid);
  if (activeSid === sid) {
    const next = [...sessions.keys()].pop();
    if (next) activate(next);
    else { activeSid = null; $("#empty").hidden = false; renderHosts(); }
  } else renderHosts();
}

function setState(s, state, message) {
  s.state = state;
  s.tab.classList.toggle("connecting", state === "connecting");
  s.tab.classList.toggle("closed", state === "closed" || state === "error");
  const ov = $(".overlay", s.pane);
  if (state === "connecting") {
    ov.hidden = false;
    ov.innerHTML = `<div class="ov-card"><div class="spinner"></div><p>${esc(message || "Conectando…")}</p></div>`;
  } else if (state === "error" || state === "closed") {
    ov.hidden = false;
    ov.innerHTML = `<div class="ov-card">
      <div class="ov-ico" style="${state === "closed" ? "background:rgba(255,255,255,.08);color:var(--text-2)" : ""}">${state === "closed" ? I.power : I.alert}</div>
      <p>${esc(message || "Desconectado.")}</p>
      <div style="display:flex;gap:8px"><button class="btn" data-a="edit">Editar</button><button class="btn primary" data-a="re">Reconectar</button></div></div>`;
    $('[data-a="re"]', ov).onclick = () => reconnect(s);
    $('[data-a="edit"]', ov).onclick = () => openEditor(hosts.find((x) => x.id === s.hostId) || s.host);
    setTimeout(() => $('[data-a="re"]', ov)?.focus(), 30);
  } else {
    ov.hidden = true;
    ov.innerHTML = "";
  }
  updateBar(s);
  renderHosts();
}

function updateBar(s) {
  const chip = $('[data-r="chip"]', s.pane);
  const p = probes.get(s.hostId);
  const label = { connected: p != null ? `${p} ms` : "conectado", connecting: "conectando", closed: "desconectado", error: "erro", idle: "" }[s.state];
  chip.className = "chip" + (s.state === "connecting" ? " warn" : s.state === "connected" ? "" : " bad");
  chip.querySelector("span").textContent = label;
  const host = hosts.find((x) => x.id === s.hostId) || s.host;
  $('[data-r="key"]', s.pane).hidden = !(s.state === "connected" && host.auth === "password");
  $('[data-r="off"]', s.pane).hidden = s.state !== "connected";
  $('[data-r="re"]', s.pane).hidden = s.state === "connected" || s.state === "connecting";
}

function reconnect(s) {
  // fresh backend session id; keep the same terminal
  const old = s.sid;
  invoke("disconnect", { sessionId: old });
  sessions.delete(old);
  s.sid = crypto.randomUUID().replace(/-/g, "");
  sessions.set(s.sid, s);
  if (activeSid === old) activeSid = s.sid;
  s.host = hosts.find((x) => x.id === s.hostId) || s.host;
  s.term.write("\r\n\x1b[2m— reconectando —\x1b[0m\r\n");
  startConnect(s);
}

function startConnect(s, secret = null, remember = false) {
  setState(s, "connecting", `Conectando a ${s.host.user}@${s.host.host}…`);
  const sid = s.sid;
  const ch = makeChannel((ev) => {
    if (s.sid !== sid) return; // stale channel from a previous attempt
    switch (ev.type) {
      case "data": s.term.write(ev.data); break; // browser preview mock only
      case "status":
        setState(s, ev.state, ev.message);
        if (ev.state === "connected") {
          if (T) pumpOutput(s, sid);
          s.term.focus();
          invoke("resize", { sessionId: s.sid, cols: s.term.cols, rows: s.term.rows });
          loadHosts();
        }
        break;
      case "needSecret": askSecret(s, ev.kind, ev.reason); break;
      case "hostKey": askHostKey(s, ev); break;
    }
  });
  invoke("connect", { sessionId: sid, hostId: s.hostId, secret, remember, cols: s.term.cols, rows: s.term.rows, onEvent: ch })
    .catch((e) => setState(s, "error", String(e)));
}

/** Pull terminal output from the backend: one long-poll in flight, raw bytes (xterm decodes UTF-8),
 *  and the next read waits until xterm has processed the previous chunk — end-to-end backpressure,
 *  so a chatty server can never build an unbounded queue in the UI. */
async function pumpOutput(s, sid) {
  while (s.sid === sid) {
    let buf;
    try { buf = await invoke("read", { sessionId: sid }); } catch { return; } // session ended
    if (s.sid !== sid) return;
    if (buf && buf.byteLength) await new Promise((done) => s.term.write(new Uint8Array(buf), done));
  }
}

function askSecret(s, kind, reason) {
  setState(s, "idle");
  $(".overlay", s.pane).hidden = false;
  let remember = true;
  const isPass = kind === "passphrase";
  openSheet(`
    <h2>${isPass ? "Senha da chave" : "Senha"}</h2>
    <p class="lead">${esc(s.host.user)}@${esc(s.host.host)}</p>
    <div class="form">
      <input class="input" id="p-val" type="password" placeholder="${isPass ? "Senha da chave privada" : "Senha do usuário"}" autofocus>
      <div class="err" id="p-err">${esc(reason || "")}</div>
      <label class="check" id="p-rem"><span class="toggle on"></span>Lembrar neste PC</label>
    </div>
    <div class="actions"><span class="grow"></span><button class="btn" id="p-cancel">Cancelar</button><button class="btn primary" id="p-ok">Conectar</button></div>`, (sh) => {
    sheetCancel = () => setState(s, "closed", "Conexão cancelada.");
    $("#p-rem", sh).onclick = () => { remember = !remember; $("#p-rem .toggle", sh).classList.toggle("on", remember); };
    $("#p-cancel", sh).onclick = closeSheet;
    const go = () => {
      const val = $("#p-val", sh).value;
      if (!val) return;
      sheetCancel = null;
      closeSheet();
      startConnect(s, val, remember);
    };
    $("#p-ok", sh).onclick = go;
    $("#p-val", sh).onkeydown = (e) => { if (e.key === "Enter") go(); };
  });
}

function askHostKey(s, ev) {
  openSheet(`
    <h2>${ev.changed ? "A identidade do servidor mudou" : "Confiar neste servidor?"}</h2>
    <p class="lead">${esc(ev.host)}</p>
    ${ev.changed ? `<div class="warn-box">A chave deste host é diferente da que foi salva. Se você não reinstalou o servidor, isso pode ser um ataque man-in-the-middle.</div>` : `<p class="lead" style="margin-top:12px">Primeira conexão. Confira a impressão digital da chave do host:</p>`}
    <div class="fp">${esc(ev.fingerprint)}</div>
    <div class="actions"><span class="grow"></span><button class="btn" id="k-no">Recusar</button><button class="btn primary" id="k-yes" autofocus>${ev.changed ? "Confiar mesmo assim" : "Confiar"}</button></div>`, (sh) => {
    const answer = (accept) => { sheetCancel = null; invoke("answer_host_key", { sessionId: s.sid, accept }); closeSheet(); };
    sheetCancel = () => invoke("answer_host_key", { sessionId: s.sid, accept: false });
    $("#k-no", sh).onclick = () => answer(false);
    $("#k-yes", sh).onclick = () => answer(true);
  });
}

async function installKey(s) {
  const btn = $('[data-r="key"]', s.pane);
  btn.disabled = true;
  btn.style.opacity = ".5";
  try {
    const path = await invoke("install_key", { sessionId: s.sid });
    toast("Pronto: próximas conexões entram sem senha 🔑");
    s.term.write(`\r\n\x1b[32m✓ chave ${path.replace(/\\/g, "/")} instalada no servidor\x1b[0m\r\n`);
    await loadHosts();
    s.host = hosts.find((x) => x.id === s.hostId) || s.host;
    updateBar(s);
  } catch (e) {
    toast(String(e));
  } finally {
    btn.disabled = false;
    btn.style.opacity = "";
  }
}

/* ---------- in-app clipboard ----------
   History of everything copied in the app (and pasted from Windows), kept in memory only:
   terminals often show passwords/tokens, so nothing is written to disk. */
const CLIP_MAX = 40;
let clips = []; // { id, text, src, color, ts, pinned }

function addClip(text, src, color) {
  if (!text || !text.trim()) return;
  const prev = clips.find((c) => c.text === text);
  clips = clips.filter((c) => c.text !== text);
  clips.unshift({ id: crypto.randomUUID(), text, src, color, ts: Date.now(), pinned: prev?.pinned || false });
  // keep pinned items, cap the rest
  let free = 0;
  clips = clips.filter((c) => c.pinned || ++free <= CLIP_MAX);
  renderClips();
}

async function copyText(text, src, color) {
  await invoke("clip_write", { text });
  addClip(text, src, color);
}

async function copySel(s) {
  // like Windows Terminal: drop the trailing padding spaces xterm adds at the end of selected lines
  const t = s.term.getSelection().replace(/[ \t]+$/gm, "");
  if (!t) return;
  await copyText(t, s.host.name, s.host.color);
  s.term.clearSelection();
  toast("Copiado");
}

async function paste(s) {
  if (s.state !== "connected") return;
  const t = await invoke("clip_read");
  if (!t) return;
  if (!clips.length || clips[0].text !== t) addClip(t, "Windows", "#8e8e93");
  s.term.paste(t);
}

/** Paste a history item into the active terminal (and make it the system clipboard too). */
async function pasteClip(c) {
  await invoke("clip_write", { text: c.text });
  const s = sessions.get(activeSid);
  if (s && s.state === "connected") {
    s.term.paste(c.text);
    s.term.focus();
    toast(`Colado em ${s.host.name}`);
  } else {
    toast("Copiado — abra um terminal para colar");
  }
}

const ago = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  return m < 1 ? "agora" : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h`;
};

function renderClips() {
  const n = clips.length;
  const badge = $("#clipBadge");
  badge.textContent = n;
  badge.hidden = !n;
  $("#clipCount").textContent = n ? `${n} ${n === 1 ? "item" : "itens"}` : "";
  $("#clipClear").hidden = !clips.some((c) => !c.pinned);

  const list = $("#clipList");
  list.innerHTML = "";
  if (!n) {
    list.append(h("div", { class: "clip-empty" }, `
      <div class="clip-empty-ico">${I.clip}</div>
      <p>Nada copiado ainda.</p>
      <p class="hint">Selecione texto em um terminal e pressione <kbd>Ctrl</kbd>+<kbd>C</kbd>.<br>Tudo que você copiar aparece aqui para colar em qualquer máquina.</p>`));
    return;
  }
  const ordered = [...clips.filter((c) => c.pinned), ...clips.filter((c) => !c.pinned)];
  ordered.forEach((c, i) => {
    const lines = c.text.split(/\r?\n/).length;
    const el = h("div", { class: "clip-item" + (c.pinned ? " pinned" : ""), title: "Clique para colar no terminal ativo" }, `
      <pre class="clip-text">${esc(c.text.length > 600 ? c.text.slice(0, 600) + "…" : c.text)}</pre>
      <div class="clip-meta">
        <span class="clip-src"><i style="background:${esc(c.color || "#8e8e93")}"></i>${esc(c.src)}</span>
        <span>· ${ago(c.ts)}${lines > 1 ? ` · ${lines} linhas` : ""}</span>
        ${i < 9 ? `<span class="clip-key">${i + 1}</span>` : ""}
      </div>
      <div class="clip-actions">
        <button class="icon-btn" data-a="pin" title="${c.pinned ? "Desafixar" : "Fixar"}">${c.pinned ? I.pinOff : I.pin}</button>
        <button class="icon-btn" data-a="copy" title="Copiar para o Windows">${I.copy}</button>
        <button class="icon-btn" data-a="del" title="Remover">${I.trash}</button>
      </div>`);
    el.onclick = async (e) => {
      const a = e.target.closest("[data-a]")?.dataset.a;
      if (a === "pin") { c.pinned = !c.pinned; renderClips(); }
      else if (a === "copy") { await invoke("clip_write", { text: c.text }); toast("Copiado"); }
      else if (a === "del") { clips = clips.filter((x) => x !== c); renderClips(); }
      else pasteClip(c);
    };
    list.append(el);
  });
}

function toggleClip(force) {
  const p = $("#clip");
  const on = force ?? !p.classList.contains("on");
  if (on) togglePrefs(false);
  p.classList.toggle("on", on);
  $("#clipBtn").classList.toggle("on", on);
  if (on) renderClips();
  else sessions.get(activeSid)?.term.focus();
}

$("#clipBtn").innerHTML = I.clip + '<span class="tb-badge" id="clipBadge" hidden></span>';
$("#clipBtn").onclick = () => toggleClip();
$("#clipClose").innerHTML = I.x;
$("#clipClose").onclick = () => toggleClip(false);
$("#clipClear").onclick = () => { clips = clips.filter((c) => c.pinned); renderClips(); };
setInterval(() => { if ($("#clip").classList.contains("on")) renderClips(); }, 30000);

/* ---------- appearance (saved in localStorage) ---------- */
// Every TrueType font the Windows console / Windows Terminal offers for PowerShell, plus the bundled default.
// (The console's bitmap "Raster Fonts" can't be used by a web view.)
const FONTS = [
  { name: "Geist Mono", tag: "padrão" },
  { name: "Cascadia Mono" },
  { name: "Cascadia Code", tag: "ligaduras" },
  { name: "Consolas" },
  { name: "Lucida Console" },
  { name: "Courier New" },
  { name: "Lucida Sans Typewriter" },
  { name: "MS Gothic" },
  { name: "NSimSun" },
  { name: "SimSun-ExtB" },
];
// The color schemes built into Windows Terminal, plus the app's own.
// c = black red green yellow blue purple cyan white, then the 8 bright variants.
const SCHEMES = [
  { name: "Liquid Glass", tag: "padrão" },
  { name: "Campbell", bg: "#0C0C0C", fg: "#CCCCCC", cursor: "#FFFFFF", c: "#0C0C0C #C50F1F #13A10E #C19C00 #0037DA #881798 #3A96DD #CCCCCC #767676 #E74856 #16C60C #F9F1A5 #3B78FF #B4009E #61D6D6 #F2F2F2" },
  { name: "Campbell Powershell", bg: "#012456", fg: "#CCCCCC", cursor: "#FFFFFF", c: "#0C0C0C #C50F1F #13A10E #C19C00 #0037DA #881798 #3A96DD #CCCCCC #767676 #E74856 #16C60C #F9F1A5 #3B78FF #B4009E #61D6D6 #F2F2F2" },
  { name: "Vintage", bg: "#000000", fg: "#C0C0C0", cursor: "#FFFFFF", c: "#000000 #800000 #008000 #808000 #000080 #800080 #008080 #C0C0C0 #808080 #FF0000 #00FF00 #FFFF00 #0000FF #FF00FF #00FFFF #FFFFFF" },
  { name: "One Half Dark", bg: "#282C34", fg: "#DCDFE4", cursor: "#FFFFFF", c: "#282C34 #E06C75 #98C379 #E5C07B #61AFEF #C678DD #56B6C2 #DCDFE4 #5A6374 #E06C75 #98C379 #E5C07B #61AFEF #C678DD #56B6C2 #DCDFE4" },
  { name: "One Half Light", bg: "#FAFAFA", fg: "#383A42", cursor: "#4F525D", c: "#383A42 #E45649 #50A14F #C18301 #0184BC #A626A4 #0997B3 #FAFAFA #4F525D #DF6C75 #98C379 #E4C07A #61AFEF #C577DD #56B5C1 #FFFFFF" },
  { name: "Solarized Dark", bg: "#002B36", fg: "#839496", cursor: "#FFFFFF", c: "#002B36 #DC322F #859900 #B58900 #268BD2 #D33682 #2AA198 #EEE8D5 #073642 #CB4B16 #586E75 #657B83 #839496 #6C71C4 #93A1A1 #FDF6E3" },
  { name: "Solarized Light", bg: "#FDF6E3", fg: "#657B83", cursor: "#002B36", c: "#002B36 #DC322F #859900 #B58900 #268BD2 #D33682 #2AA198 #EEE8D5 #073642 #CB4B16 #586E75 #657B83 #839496 #6C71C4 #93A1A1 #FDF6E3" },
  { name: "Tango Dark", bg: "#000000", fg: "#D3D7CF", cursor: "#FFFFFF", c: "#000000 #CC0000 #4E9A06 #C4A000 #3465A4 #75507B #06989A #D3D7CF #555753 #EF2929 #8AE234 #FCE94F #729FCF #AD7FA8 #34E2E2 #EEEEEC" },
  { name: "Tango Light", bg: "#FFFFFF", fg: "#555753", cursor: "#000000", c: "#000000 #CC0000 #4E9A06 #C4A000 #3465A4 #75507B #06989A #D3D7CF #555753 #EF2929 #8AE234 #FCE94F #729FCF #AD7FA8 #34E2E2 #EEEEEC" },
  { name: "Dark+", bg: "#1E1E1E", fg: "#CCCCCC", cursor: "#808080", c: "#000000 #CD3131 #0DBC79 #E5E510 #2472C8 #BC3FBC #11A8CD #E5E5E5 #666666 #F14C4C #23D18B #F5F543 #3B8EEA #D670D6 #29B8DB #E5E5E5" },
  { name: "CGA", bg: "#000000", fg: "#AAAAAA", cursor: "#B8B8B8", c: "#000000 #AA0000 #00AA00 #AA5500 #0000AA #AA00AA #00AAAA #AAAAAA #555555 #FF5555 #55FF55 #FFFF55 #5555FF #FF55FF #55FFFF #FFFFFF" },
  { name: "IBM 5153", bg: "#000000", fg: "#AAAAAA", cursor: "#FFFFFF", c: "#000000 #AA0000 #00AA00 #C47E00 #0000AA #AA00AA #00AAAA #AAAAAA #555555 #FF5555 #55FF55 #FFFF55 #5555FF #FF55FF #55FFFF #FFFFFF" },
  { name: "Ottosson", bg: "#000000", fg: "#BEBEBE", cursor: "#FFFFFF", c: "#000000 #BE2C21 #3FAE3A #BE9A4A #204DBE #BB54BE #00A7B2 #BEBEBE #808080 #FF3E30 #58EA51 #FFC944 #2F6AFF #FC74FF #00E1F0 #FFFFFF" },
];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const isLight = (hex) => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b > 150; };
const schemeOf = () => SCHEMES.find((x) => x.name === prefs.scheme) || SCHEMES[0];
const schemeColors = (sc) => (sc.c ? sc.c.split(" ") : [THEME.black, THEME.red, THEME.green, THEME.yellow, THEME.blue, THEME.magenta, THEME.cyan, THEME.white]);

/** xterm theme for the current scheme; the background stays transparent so the glass shows through */
function termTheme() {
  const sc = schemeOf();
  if (!sc.c) return THEME;
  const c = sc.c.split(" ");
  const keys = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
  const t = { background: "rgba(0,0,0,0)", foreground: sc.fg, cursor: sc.cursor, cursorAccent: sc.bg, selectionBackground: `rgba(${rgb(sc.fg).join(",")},0.3)` };
  keys.forEach((k, i) => { t[k] = c[i]; t["bright" + k[0].toUpperCase() + k.slice(1)] = c[i + 8]; });
  return t;
}

const PREF_KEY = "appearance.v1";
// blocks: 54% reproduces the original glass (alpha .46 / .72 / .62)
const PREF_DEFAULT = { app: 0, blocks: 54, font: "Geist Mono", size: 13.5, scheme: "Liquid Glass" };
let prefs = { ...PREF_DEFAULT };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || "{}")); } catch {}

const termFont = () => `"${prefs.font}", "Geist Mono", Consolas, monospace`;

/** true if the font is installed (its metrics differ from both generic fallbacks) */
const fontInstalled = (() => {
  const ctx = document.createElement("canvas").getContext("2d");
  const w = (f) => { ctx.font = `32px ${f}`; return ctx.measureText("mmmmmmmmmmlli10WQ@").width; };
  return (name) => ["monospace", "serif"].some((g) => w(`"${name}", ${g}`) !== w(g));
})();

function applyPrefs(save = true) {
  const r = document.documentElement.style;
  r.setProperty("--wall-a", String(1 - prefs.app / 100));
  const a = 1 - prefs.blocks / 100;
  r.setProperty("--glass", `rgba(28, 30, 38, ${a.toFixed(3)})`);
  r.setProperty("--glass-strong", `rgba(30, 32, 42, ${Math.min(1, a + 0.26).toFixed(3)})`);
  // the terminal area takes the scheme's background color, at the blocks' transparency
  const sc = schemeOf();
  const bg = sc.bg ? rgb(sc.bg).join(", ") : "12, 14, 20";
  r.setProperty("--stage-bg", `rgba(${bg}, ${Math.min(1, a + 0.16).toFixed(3)})`);
  $("#stage").classList.toggle("light", !!sc.bg && isLight(sc.bg));
  for (const s of sessions.values()) {
    if (s.scheme !== sc.name) { s.term.options.theme = termTheme(); s.scheme = sc.name; }
    if (s.term.options.fontFamily !== termFont()) s.term.options.fontFamily = termFont();
    if (s.term.options.fontSize !== prefs.size) s.term.options.fontSize = prefs.size;
    if (!s.pane.hidden) try { s.fit.fit(); } catch {}
  }
  if (save) try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
}

function syncPrefsUI() {
  for (const [id, key] of [["app", "app"], ["blocks", "blocks"]]) {
    const el = $("#r-" + id);
    el.value = prefs[key];
    el.style.setProperty("--p", prefs[key] / el.max);
    $("#o-" + id).textContent = prefs[key] + "%";
  }
  $("#o-size").textContent = prefs.size + "px";
  // each setting's "back to default" arrow shows only while it differs from the default
  document.querySelectorAll("#prefs .rst").forEach((b) => {
    if (!b.firstChild) b.innerHTML = I.undo;
    b.classList.toggle("off", prefs[b.dataset.k] === PREF_DEFAULT[b.dataset.k]);
    b.title = `Restaurar padrão (${RST_LABEL[b.dataset.k](PREF_DEFAULT[b.dataset.k])})`;
  });
}
const RST_LABEL = { app: (v) => v + "%", blocks: (v) => v + "%", size: (v) => v + " px", font: (v) => v, scheme: (v) => v };

/**
 * Collapsible picker: the head shows the current choice; clicking it slides open the other options.
 * Opening one picker closes the others.
 */
function renderPicker(el, items, current, row, pick) {
  el.classList.remove("open");
  const cur = items.find((x) => x.name === current) || items[0];
  el.innerHTML = "";
  const head = h("button", { class: "pick-head" + (row.cls ? " " + row.cls : "") }, row(cur) + `<span class="chev">${I.chevron}</span>`);
  const inner = h("div", { class: "pick-inner" });
  for (const it of items) {
    if (it === cur) continue;
    const b = h("button", { class: "pick-opt" + (row.cls ? " " + row.cls : "") + (row.missing?.(it) ? " missing" : ""), title: row.title?.(it) || "" }, row(it));
    b.onclick = () => { el.classList.remove("open"); pick(it); };
    inner.append(b);
  }
  head.onclick = () => {
    const open = !el.classList.contains("open");
    document.querySelectorAll("#prefs .picker.open").forEach((p) => p.classList.remove("open"));
    el.classList.toggle("open", open);
    if (open) setTimeout(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }), 320);
  };
  const body = h("div", { class: "pick-body" });
  body.append(inner);
  const headRow = h("div", { class: "pick-row" });
  headRow.append(head, h("button", { class: "rst", "data-k": el.dataset.k }));
  el.append(headRow, body);
}

// detection can miss fonts the web view hasn't indexed yet, so undetected ones stay selectable
// (if the font really is missing, the terminal just falls back to Geist Mono)
const fontMissing = (f) => f.name !== "Geist Mono" && !fontInstalled(f.name);
const fontRow = (f) => `<span class="pname" style="font-family:'${f.name}', monospace">${esc(f.name)}</span>${fontMissing(f) ? `<span class="ptag">não detectada</span>` : f.tag ? `<span class="ptag">${f.tag}</span>` : ""}`;
fontRow.missing = fontMissing;
fontRow.title = (f) => (fontMissing(f) ? "Não detectada neste PC — se não estiver instalada, o terminal usa a Geist Mono" : "");

const schemeRow = (sc) => `<span class="sw-strip" style="background:${sc.bg || "#0c0e14"}">${schemeColors(sc).slice(0, 8).map((c) => `<i style="background:${c}"></i>`).join("")}</span><span class="pname">${esc(sc.name)}</span>${sc.tag ? `<span class="ptag">${sc.tag}</span>` : ""}`;
schemeRow.cls = "pick-scheme";

/* ---------- server icons ----------
   Any image the user picks is center-cropped to a square and downscaled to ICON_PX,
   so what gets stored in hosts.json stays small (a few KB). */
const ICON_PX = 128;
let iconTarget = null; // host whose icon is being changed

async function imageToIcon(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w = img.naturalWidth || ICON_PX, h0 = img.naturalHeight || ICON_PX;
    const side = Math.min(w, h0);
    const c = document.createElement("canvas");
    c.width = c.height = ICON_PX;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (w - side) / 2, (h0 - side) / 2, side, side, 0, 0, ICON_PX, ICON_PX);
    // PNG keeps transparency; fall back to JPEG if a photo would make the PNG large
    const png = c.toDataURL("image/png");
    return png.length < 150_000 ? png : c.toDataURL("image/jpeg", 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function setHostIcon(host, icon) {
  try {
    await invoke("set_host_icon", { id: host.id, icon });
  } catch (e) {
    return toast(String(e));
  }
  await loadHosts();
  // refresh the avatar in the bar of any open terminal for this host
  for (const s of sessions.values()) {
    if (s.hostId !== host.id) continue;
    s.host = hosts.find((x) => x.id === host.id) || s.host;
    $('[data-r="face"]', s.pane).innerHTML = face(s.host);
  }
  renderIconList();
  toast(icon ? `Ícone de “${host.name}” atualizado` : `“${host.name}” voltou às iniciais`);
}

async function useIconFile(host, file) {
  if (!file || !file.type.startsWith("image/")) return toast("Escolha um arquivo de imagem");
  try {
    await setHostIcon(host, await imageToIcon(file));
  } catch {
    toast("Não consegui ler essa imagem");
  }
}

/** one row per saved server: current icon, name, pencil to change it (and undo when it's custom) */
function renderIconList() {
  const list = $("#iconList");
  list.innerHTML = "";
  if (!hosts.length) {
    list.append(h("div", { class: "hint", style: "padding:10px" }, "Nenhuma máquina cadastrada ainda."));
    return;
  }
  for (const host of hosts) {
    const row = h("div", { class: "icon-row" }, `
      <div class="avatar" style="--c:${esc(host.color)}" title="Arraste uma imagem aqui">${face(host)}</div>
      <div class="host-meta"><div class="host-name">${esc(host.name)}</div><div class="host-sub">${esc(host.host)}</div></div>
      ${host.icon ? `<button class="icon-btn" data-a="reset" title="Voltar às iniciais">${I.undo}</button>` : ""}
      <button class="icon-btn" data-a="edit" title="Trocar ícone">${I.pencil}</button>`);
    row.onclick = (e) => {
      const a = e.target.closest("[data-a]")?.dataset.a;
      if (a === "reset") setHostIcon(host, "");
      else if (a === "edit" || e.target.closest(".avatar")) { iconTarget = host; $("#iconFile").value = ""; $("#iconFile").click(); }
    };
    // dropping an image file on the row works too
    const av = $(".avatar", row);
    row.ondragover = (e) => { e.preventDefault(); av.classList.add("drop"); };
    row.ondragleave = () => av.classList.remove("drop");
    row.ondrop = (e) => { e.preventDefault(); av.classList.remove("drop"); useIconFile(host, e.dataTransfer.files[0]); };
    list.append(row);
  }
}
// HTML5 file drops are on (tauri.conf: dragDropEnabled=false) so the icon rows can take dropped images;
// everywhere else, swallow drops so a dropped file doesn't make the webview navigate to it
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());
$("#iconFile").onchange =(e) => { if (iconTarget) useIconFile(iconTarget, e.target.files[0]); };

function renderPickers() {
  renderPicker($("#fontPick"), FONTS, prefs.font, fontRow, (f) => { prefs.font = f.name; applyPrefs(); renderPickers(); });
  renderPicker($("#schemePick"), SCHEMES, prefs.scheme, schemeRow, (sc) => { prefs.scheme = sc.name; applyPrefs(); renderPickers(); });
  syncPrefsUI();
}

// one handler for every "back to default" arrow (sliders, size, font, scheme)
$("#prefs").addEventListener("click", (e) => {
  const k = e.target.closest(".rst")?.dataset.k;
  if (!k) return;
  prefs[k] = PREF_DEFAULT[k];
  applyPrefs();
  if (k === "font" || k === "scheme") renderPickers();
  syncPrefsUI();
});

function togglePrefs(force) {
  const p = $("#prefs");
  const on = force ?? !p.classList.contains("on");
  if (on === p.classList.contains("on")) return;
  if (on) { toggleClip(false); renderPickers(); renderIconList(); syncPrefsUI(); }
  p.classList.toggle("on", on);
  $("#setBtn").classList.toggle("on", on);
  if (!on) sessions.get(activeSid)?.term.focus();
}

for (const key of ["app", "blocks"]) {
  $("#r-" + key).oninput = (e) => { prefs[key] = +e.target.value; applyPrefs(false); syncPrefsUI(); };
  $("#r-" + key).onchange = () => applyPrefs();
}
const setSize = (d) => { prefs.size = Math.min(24, Math.max(9, Math.round((prefs.size + d) * 2) / 2)); applyPrefs(); syncPrefsUI(); };
$("#fsDown").onclick = () => setSize(-0.5);
$("#fsUp").onclick = () => setSize(0.5);
$("#prefsReset").onclick = () => { prefs = { ...PREF_DEFAULT }; applyPrefs(); renderPickers(); syncPrefsUI(); };
document.querySelectorAll("#prefs .s-ico").forEach((el) => (el.innerHTML = I[el.dataset.i]));
$("#setBtn").innerHTML = I.gear;
$("#setBtn").onclick = () => togglePrefs();
$("#prefsClose").innerHTML = I.x;
$("#prefsClose").onclick = () => togglePrefs(false);
applyPrefs(false);

/* ---------- terminal context menu ---------- */
function openTermMenu(s, x, y) {
  closeMenu();
  const sel = s.term.hasSelection();
  const live = s.state === "connected";
  const items = [
    { label: "Copiar", key: "Ctrl+C", icon: I.copy, off: !sel, run: () => copySel(s) },
    { label: "Colar", key: "Ctrl+V", icon: I.paste, off: !live, run: () => paste(s) },
    "-",
    { label: "Área de transferência", key: "Ctrl+Shift+V", icon: I.clip, run: () => toggleClip(true) },
    { label: "Selecionar tudo", key: "Ctrl+Shift+A", icon: I.selectAll, run: () => s.term.selectAll() },
    { label: "Limpar tela", icon: I.eraser, run: () => s.term.clear() },
  ];
  const m = h("div", { class: "ctx glass-strong", id: "ctx" });
  for (const it of items) {
    if (it === "-") { m.append(h("div", { class: "ctx-sep" })); continue; }
    const b = h("button", { class: "ctx-item" }, `${it.icon}<span>${it.label}</span>${it.key ? `<kbd>${it.key}</kbd>` : ""}`);
    if (it.off) b.disabled = true;
    b.onclick = () => { closeMenu(); it.run(); if (!it.label.startsWith("Área")) s.term.focus(); };
    m.append(b);
  }
  document.body.append(m);
  const r = m.getBoundingClientRect();
  m.style.left = Math.min(x, innerWidth - r.width - 8) + "px";
  m.style.top = Math.min(y, innerHeight - r.height - 8) + "px";
}
function closeMenu() { $("#ctx")?.remove(); }
document.addEventListener("mousedown", (e) => { if (!e.target.closest("#ctx")) closeMenu(); });
// capture phase: xterm swallows Escape, but an open menu should still close (without sending ESC to the server)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#ctx")) { e.preventDefault(); e.stopPropagation(); closeMenu(); }
}, true);
window.addEventListener("blur", closeMenu);

function toast(msg) {
  const t = h("div", { class: "toast" }, esc(msg));
  $("#toasts").append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 2600);
}

/* ---------- global shortcuts ---------- */
document.addEventListener("keydown", (e) => {
  const clipOn = $("#clip").classList.contains("on");
  if (e.key === "Escape" && $("#ctx")) { e.preventDefault(); closeMenu(); }
  else if (e.key === "Escape" && $("#sheet").classList.contains("on")) { e.preventDefault(); closeSheet(); }
  else if (e.key === "Escape" && clipOn) { e.preventDefault(); toggleClip(false); }
  else if (e.key === "Escape" && $("#prefs").classList.contains("on")) { e.preventDefault(); togglePrefs(false); }
  else if (e.ctrlKey && e.key === ",") { e.preventDefault(); togglePrefs(); }
  else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "v" && e.target.tagName !== "INPUT") { e.preventDefault(); toggleClip(); }
  // with the clipboard panel open, 1-9 pastes that item (only when typing isn't going to a terminal/input)
  else if (clipOn && /^[1-9]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.target.closest(".xterm, input")) {
    const ordered = [...clips.filter((c) => c.pinned), ...clips.filter((c) => !c.pinned)];
    const c = ordered[+e.key - 1];
    if (c) { e.preventDefault(); pasteClip(c); }
  }
  else if (e.ctrlKey && e.key.toLowerCase() === "n") { e.preventDefault(); openEditor(); }
  else if (e.ctrlKey && e.key.toLowerCase() === "f" && !$("#sheet").classList.contains("on")) { e.preventDefault(); $("#search").focus(); }
  else if (e.ctrlKey && e.key === "Tab") { e.preventDefault(); cycle(e.shiftKey ? -1 : 1); }
  // block webview reload / devtools / zoom shortcuts
  else if (e.key === "F5" || (e.ctrlKey && ["r", "p", "u", "j"].includes(e.key.toLowerCase()))) e.preventDefault();
});
document.addEventListener("contextmenu", (e) => { if (!e.target.closest("input")) e.preventDefault(); });

// xterm measures glyph width when a terminal opens: make sure the bundled fonts are ready first
Promise.all([document.fonts.load('13px "Geist"'), document.fonts.load('13px "Geist Mono"'), document.fonts.load('bold 13px "Geist Mono"')])
  .catch(() => {})
  .finally(async () => {
    await loadHosts();
    // "SSH Connector.exe --connect <name|id>"
    if (T) {
      const want = await invoke("startup_connect").catch(() => null);
      const target = want && hosts.find((x) => x.id === want || x.name.toLowerCase() === want.toLowerCase());
      if (target) openSessionFor(target);
      else if (want) toast(`Máquina “${want}” não encontrada`);
    }
    // browser preview only: index.html#demo opens a sample session (used for README screenshots)
    if (!T && location.hash.startsWith("#demo") && hosts[0]) openSessionFor(hosts[0]);
    if (!T && location.hash === "#flood") startFlood();
    if (!T && location.hash === "#demo-clip") {
      addClip("docker compose up -d", "Fedora Server", "#5ac8fa");
      addClip("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHk3x… admin@fedora", "Fedora Server", "#5ac8fa");
      addClip("journalctl -u nginx --since \"10 min ago\"\nsystemctl restart nginx", "Proxmox", "#ff9f0a");
      clips[2].pinned = true;
      addClip("192.168.1.53", "Windows", "#8e8e93");
      toggleClip(true);
    }
  });

/* ---------- browser preview stress test: index.html#flood ----------
   Simulates a heavy TUI (agent / htop style full redraws at ~30 fps plus a scrolling log)
   and reports fps + main-thread long tasks in document.title, for before/after benchmarks. */
function startFlood() {
  // no rAF counter here on purpose: it would force continuous frames and skew the CPU numbers
  let longMs = 0, tick = 0;
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => (longMs += e.duration))).observe({ entryTypes: ["longtask"] }); } catch {}
  setInterval(() => { document.title = `fps=0 long=${Math.round(longMs)}`; longMs = 0; }, 1000);
  const spin = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
  openSessionFor(hosts[0]);
  setTimeout(() => {
    const s = [...sessions.values()][0];
    setInterval(() => {
      tick++;
      let out = "\x1b[H";
      for (let r = 0; r < 28; r++) {
        const pct = (tick * 3 + r * 7) % 100;
        out += `\x1b[2K\x1b[38;5;${(r * 7 + tick) % 230 + 17}m${spin[(tick + r) % 10]} worker-${String(r).padStart(2, "0")} \x1b[0m` +
          `[\x1b[32m${"█".repeat(pct / 4 | 0)}\x1b[90m${"░".repeat(25 - (pct / 4 | 0))}\x1b[0m] ${String(pct).padStart(3)}%  ` +
          `\x1b[2mreq=${(tick * 13 + r * 101) % 99999} lat=${(tick + r) % 250}ms\x1b[0m\r\n`;
      }
      s.term.write(out);
    }, 33);
  }, 800);
}

/* ---------- browser preview mock (fictional data; only used outside Tauri) ---------- */

function mockInvoke(cmd, args) {
  const db = (mockInvoke.db ||= [
    { id: "1", name: "Fedora Server", host: "192.168.1.20", port: 22, user: "admin", auth: "key", keyPath: "", color: "#5ac8fa", hasSecret: false },
    { id: "2", name: "Proxmox", host: "192.168.1.10", port: 22, user: "root", auth: "key", keyPath: "", color: "#ff9f0a", hasSecret: false },
    { id: "3", name: "Pi-hole", host: "192.168.1.53", port: 22, user: "pi", auth: "password", keyPath: "", color: "#ff453a", hasSecret: true },
    { id: "4", name: "NAS", host: "192.168.1.40", port: 2222, user: "admin", auth: "key", keyPath: "", color: "#30d158", hasSecret: false },
    { id: "5", name: "Home Assistant", host: "192.168.1.60", port: 22, user: "hass", auth: "password", keyPath: "", color: "#bf5af2", hasSecret: true },
  ]);
  const ping = { "192.168.1.20": 2, "192.168.1.10": 1, "192.168.1.53": 3, "192.168.1.40": 4, "192.168.1.60": null };
  const P = "\x1b[1;32madmin@fedora\x1b[0m:\x1b[1;34m~\x1b[0m$ ";
  const demo = [
    "Last login: Thu Nov 12 17:02:11 2026 from 192.168.1.5\r\n",
    P + "uptime\r\n 17:04:52 up 23 days,  4:11,  1 user,  load average: 0.18, 0.22, 0.19\r\n",
    P + "docker ps --format 'table {{.Names}}\\t{{.Status}}'\r\n",
    "\x1b[1mNAMES            STATUS\x1b[0m\r\n",
    "jellyfin         Up 6 days (healthy)\r\nnextcloud        Up 6 days\r\ngrafana          Up 12 days\r\nprometheus       Up 12 days\r\ntraefik          Up 23 days\r\n",
    P + "df -h /srv\r\n",
    "Filesystem      Size  Used Avail Use% Mounted on\r\n/dev/sda1       1.8T  742G  1.1T  41% /srv\r\n",
    P,
  ].join("");
  switch (cmd) {
    case "list_hosts": return Promise.resolve(db.slice());
    case "probe": return Promise.resolve(ping[args.host] ?? null);
    case "save_host": { const x = { ...args.input, id: args.input.id || String(Date.now()), hasSecret: false, icon: db.find((d) => d.id === args.input.id)?.icon || "" }; const i = db.findIndex((d) => d.id === x.id); i >= 0 ? (db[i] = x) : db.push(x); return Promise.resolve(x); }
    case "set_host_icon": { const x = db.find((d) => d.id === args.id); if (x) x.icon = args.icon; return Promise.resolve(); }
    case "connect": setTimeout(() => { args.onEvent.onmessage({ type: "status", state: "connected", message: "" }); args.onEvent.onmessage({ type: "data", data: demo }); }, 400); return Promise.resolve();
    default: return Promise.resolve(cmd === "clip_read" ? "" : null);
  }
}
