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
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
  sidebar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg>',
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
  const before = hosts.map((x) => probes.get(x.id) == null).join();
  await Promise.all(hosts.map(async (host) => probes.set(host.id, await invoke("probe", { host: host.host, port: host.port }))));
  // only online/offline changes touch the list; latency numbers live in the quick cards and terminal chips
  if (hosts.map((x) => probes.get(x.id) == null).join() !== before) renderHosts();
  else if (!$("#empty").hidden) renderQuick();
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
      <button class="crumb" data-r="crumb" hidden>${I.folder}<span></span></button>
      <span class="gitchip" data-r="git" hidden></span>
      <span class="grow"></span>
      <button class="pbtn" data-r="find" title="Buscar no terminal (Ctrl+Shift+F)">${I.search}</button>
      <button class="pbtn" data-r="key" title="Gera uma chave e instala no servidor: próximas conexões sem senha">${I.key}Login sem senha</button>
      <button class="pbtn" data-r="re" title="Reconectar">${I.redo}</button>
      <button class="pbtn" data-r="off" title="Desconectar">${I.power}</button>
    </div>
    <div class="term"></div>
    <div class="findbar glass-strong" hidden>
      <span class="find-ico">${I.search}</span>
      <input type="text" placeholder="Buscar no terminal" spellcheck="false" autocomplete="off">
      <output class="find-count"></output>
      <button class="find-opt" data-o="caseSensitive" title="Diferenciar maiúsculas">Aa</button>
      <button class="find-opt" data-o="wholeWord" title="Palavra inteira"><u>ab</u></button>
      <button class="find-opt" data-o="regex" title="Expressão regular">.*</button>
      <span class="find-sep"></span>
      <button class="icon-btn" data-f="prev" title="Anterior (Shift+Enter)">${I.up}</button>
      <button class="icon-btn" data-f="next" title="Próximo (Enter)">${I.down}</button>
      <button class="icon-btn" data-f="close" title="Fechar (Esc)">${I.x}</button>
    </div>
    <div class="suggest glass-strong" hidden></div>
    <div class="overlay" hidden></div>`);
  $("#stage").append(pane);

  const term = new Terminal({
    ...termOptions(),
    allowTransparency: true,
    theme: termTheme(),
    macOptionIsMeta: true,
    rightClickSelectsWord: false,
    allowProposedApi: true, // search highlights (decorations) + result count
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.loadAddon(new WebLinksAddon.WebLinksAddon());
  const search = new SearchAddon.SearchAddon({ highlightLimit: 2000 });
  term.loadAddon(search);
  term.open($(".term", pane));
  const s0 = { webgl: false };
  if (prefs.renderer === "webgl") {
    // GPU renderer: also draws powerline/box glyphs itself (prompt flags look perfect without special fonts)
    try {
      const gl = new WebglAddon.WebglAddon();
      gl.onContextLoss(() => { gl.dispose(); s0.webgl = false; term.options.cursorBlink = false; });
      term.loadAddon(gl);
      s0.webgl = true;
      term.options.cursorBlink = prefs.cursorBlink; // WebGL blinks by redrawing only the cursor: cheap
    } catch (e) { console.warn("WebGL indisponível, usando o renderizador DOM", e); }
  }

  const s = { sid, hostId: host.id, host, term, fit, search, pane, get webgl() { return s0.webgl; }, state: "idle", tab: null, scheme: schemeOf().name,
              find: { caseSensitive: false, wholeWord: false, regex: false },
              ac: { line: "", clean: true, hist: [], items: [], sel: 0, dismissed: null } };
  sessions.set(sid, s);
  setupFind(s);
  setupSuggest(s);
  setupShellIntegration(s);
  $('[data-r="crumb"]', pane).onclick = () => { if (s.cwdAbs || s.cwd) copyText(s.cwdAbs || s.cwd, s.host.name, s.host.color).then(() => toast("Caminho copiado")); };

  // keyboard, Windows Terminal style:
  //   Ctrl+C copies when there is a selection (otherwise it's SIGINT), Ctrl+Shift+C / Ctrl+Insert copy,
  //   Ctrl+V / Shift+Insert paste, Ctrl+Shift+V opens the in-app clipboard
  term.attachCustomKeyEventHandler((e) => {
    if (e.type !== "keydown") return true;
    const k = e.key.toLowerCase();
    const stop = () => { e.preventDefault(); return false; };
    if (suggestKey(s, e)) return stop();
    if (e.ctrlKey && e.shiftKey && k === "f") { openFind(s); return stop(); }
    if (e.key === "F3" && !$(".findbar", s.pane).hidden) { runFind(s, !e.shiftKey); return stop(); }
    if (e.ctrlKey && e.shiftKey && k === "v") { toggleClip(); return stop(); }
    if (e.ctrlKey && k === ",") { togglePrefs(); return stop(); }
    if (e.ctrlKey && k === "c" && (e.shiftKey || term.hasSelection())) { copySel(s); return stop(); }
    if (e.ctrlKey && k === "insert") { copySel(s); return stop(); }
    if ((e.ctrlKey && k === "v") || (e.shiftKey && k === "insert")) { paste(s); return stop(); }
    if (e.ctrlKey && e.shiftKey && k === "a") { term.selectAll(); return stop(); }
    if (e.ctrlKey && e.shiftKey && k === "w") { closeSession(sid); return stop(); }
    if (e.ctrlKey && e.shiftKey && k === "b") { $("#sideBtn").click(); return stop(); }
    if (e.ctrlKey && k === ",") { togglePrefs(); return stop(); }
    if (e.ctrlKey && k === "tab") { cycle(e.shiftKey ? -1 : 1); return stop(); }
    return true;
  });
  $(".term", pane).addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openTermMenu(s, e.clientX, e.clientY);
  });

  term.onData((d) => { if (s.state !== "connected") return; cursorSolid(s); trackInput(s, d); invoke("write", { sessionId: s.sid, data: d }); });
  // the local grid follows the window every frame; the server only hears about the final size
  term.onResize(() => {
    if (s.state !== "connected") return;
    clearTimeout(s.resizeT);
    s.resizeT = setTimeout(() => invoke("resize", { sessionId: s.sid, cols: s.term.cols, rows: s.term.rows }), 120);
  });

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

/* Cursor blink without xterm's infinite CSS animation: that keeps Chromium producing frames at 60 fps
   even when idle (~3% CPU per idle session). Here a 530 ms timer flips a class on the visible terminal
   only — 2 style changes per second — and typing keeps the cursor solid, like a real terminal. */
let blinkOff = false;
function cursorBlinker() {
  const s = sessions.get(activeSid);
  const live = s && !s.webgl && prefs.cursorBlink && !s.pane.hidden && document.hasFocus() && !document.hidden &&
    s.term.element?.classList.contains("focus");
  blinkOff = live ? !blinkOff : false;
  for (const x of sessions.values()) x.pane.querySelector(".term").classList.toggle("cur-off", blinkOff && x === s);
}
setInterval(cursorBlinker, 530);
function cursorSolid(s) {
  if (!blinkOff) return;
  blinkOff = false;
  s.pane.querySelector(".term").classList.remove("cur-off");
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
          loadRemoteHistory(s);
          s.term.focus();
          invoke("resize", { sessionId: s.sid, cols: s.term.cols, rows: s.term.rows });
          loadHosts();
        }
        break;
      case "needSecret": askSecret(s, ev.kind, ev.reason); break;
      case "hostKey": askHostKey(s, ev); break;
    }
  });
  invoke("connect", { sessionId: sid, hostId: s.hostId, secret, remember, cols: s.term.cols, rows: s.term.rows, prompt: promptConfig(), onEvent: ch })
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

/* ---------- find in terminal (Ctrl+Shift+F / magnifier) ---------- */
const toHex = (c) => "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
function findDecorations() {
  const a = rgb(/^#[0-9a-f]{6}$/i.test(prefs.accent) ? prefs.accent : PREF_DEFAULT.accent);
  return {
    matchBackground: toHex(mix(a, [0, 0, 0], 0.55)),
    matchOverviewRuler: toHex(a),
    activeMatchBackground: toHex(a),
    activeMatchColorOverviewRuler: "#ffffff",
  };
}

function setupFind(s) {
  const fb = $(".findbar", s.pane), inp = $("input", fb), count = $(".find-count", fb);
  s.search.onDidChangeResults(({ resultIndex, resultCount }) => {
    count.textContent = !inp.value ? "" : resultCount === 0 ? "nada" : resultIndex < 0 ? `${resultCount}` : `${resultIndex + 1} de ${resultCount}`;
    fb.classList.toggle("nf", !!inp.value && resultCount === 0);
  });
  inp.oninput = () => runFind(s, true, true);
  inp.onkeydown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); runFind(s, !e.shiftKey); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeFind(s); }
    else if (e.key === "F3") { e.preventDefault(); runFind(s, !e.shiftKey); }
  };
  fb.querySelectorAll(".find-opt").forEach((b) => (b.onclick = () => {
    s.find[b.dataset.o] = !s.find[b.dataset.o];
    b.classList.toggle("on", s.find[b.dataset.o]);
    runFind(s, true, true);
    inp.focus();
  }));
  fb.querySelector('[data-f="prev"]').onclick = () => { runFind(s, false); inp.focus(); };
  fb.querySelector('[data-f="next"]').onclick = () => { runFind(s, true); inp.focus(); };
  fb.querySelector('[data-f="close"]').onclick = () => closeFind(s);
  $('[data-r="find"]', s.pane).onclick = () => openFind(s);
}

function openFind(s) {
  const fb = $(".findbar", s.pane), inp = $("input", fb);
  hideSuggest(s);
  fb.hidden = false;
  const sel = s.term.getSelection();
  if (sel && !sel.includes("\n") && sel.length < 200) inp.value = sel.trim();
  inp.focus();
  inp.select();
  if (inp.value) runFind(s, true, true);
}

function closeFind(s) {
  const fb = $(".findbar", s.pane);
  if (fb.hidden) return;
  fb.hidden = true;
  s.search.clearDecorations();
  s.term.clearSelection();
  s.term.focus();
}

function runFind(s, forward = true, incremental = false) {
  const fb = $(".findbar", s.pane), q = $("input", fb).value;
  if (!q) { s.search.clearDecorations(); $(".find-count", fb).textContent = ""; fb.classList.remove("nf"); return; }
  if (s.find.regex) { try { new RegExp(q); } catch { $(".find-count", fb).textContent = "regex inválida"; fb.classList.add("nf"); return; } }
  const opts = { ...s.find, incremental: incremental && forward, decorations: findDecorations() };
  forward ? s.search.findNext(q, opts) : s.search.findPrevious(q, opts);
}

/* ---------- command suggestions (autocomplete) ----------
   Tracks what you type on the current shell line and suggests matching commands from the server's shell
   history (fetched on connect) plus what you ran in this session. ↑↓ choose, → accepts, Esc hides.
   Tab is left alone (it's the shell's own completion). Everything stays in memory only. */
const AC_MAX = 6;

function setupSuggest(s) {
  const box = $(".suggest", s.pane);
  box.addEventListener("mousedown", (e) => {
    const i = e.target.closest("[data-i]")?.dataset.i;
    if (i == null) return;
    e.preventDefault();
    acceptSuggest(s, +i);
    s.term.focus();
  });
  s.term.onScroll(() => hideSuggest(s));
}

/** Called with every chunk the user types (before it is sent). Keeps s.ac.line in sync when it can. */
function trackInput(s, d) {
  const ac = s.ac;
  if (d === "\r") {
    commitLine(s);
    ac.line = ""; ac.clean = true; ac.dismissed = null;
  } else if (d === "\x7f" || d === "\b") {
    ac.line = ac.line.slice(0, -1);
  } else if (d === "\x03" || d === "\x15") { // Ctrl+C, Ctrl+U: fresh line
    ac.line = ""; ac.clean = true; ac.dismissed = null;
  } else if (/^[^\x00-\x1f\x7f]+$/.test(d)) { // plain text (typing or a single-line paste)
    ac.line += d;
  } else {
    // Tab completion, arrows, Ctrl+A/W/R…, multi-line pastes: we no longer know the line
    ac.clean = false;
  }
  updateSuggest(s);
}

/** Remember a command once Enter is pressed, but only if it was echoed on screen (passwords aren't). */
function commitLine(s) {
  const cmd = s.ac.line.trim();
  if (!s.ac.clean || cmd.length < 2 || s.term.buffer.active.type !== "normal") return;
  const b = s.term.buffer.active, y = b.baseY + b.cursorY;
  let screen = "";
  for (let i = Math.max(0, y - 3); i <= y; i++) screen += b.getLine(i)?.translateToString(true) || "";
  if (!screen.includes(cmd.slice(0, Math.min(cmd.length, 6)))) return; // not echoed → probably a password
  s.ac.hist = [cmd, ...s.ac.hist.filter((x) => x !== cmd)].slice(0, 3000);
}

function updateSuggest(s) {
  const ac = s.ac;
  const q = ac.line;
  const ok = prefs.autocomplete && s.state === "connected" && ac.clean && q.trim().length >= 2 &&
    q !== ac.dismissed && s.term.buffer.active.type === "normal" && $(".findbar", s.pane).hidden;
  if (!ok) return hideSuggest(s);
  const starts = [], contains = [];
  for (const c of ac.hist) {
    if (c === q) continue;
    if (c.startsWith(q)) starts.push(c);
    else if (q.length >= 3 && c.includes(q)) contains.push(c);
    if (starts.length >= AC_MAX) break;
  }
  ac.items = [...starts, ...contains].slice(0, AC_MAX);
  if (!ac.items.length) return hideSuggest(s);
  ac.sel = Math.min(ac.sel, ac.items.length - 1);
  renderSuggest(s);
}

function renderSuggest(s) {
  const ac = s.ac, box = $(".suggest", s.pane);
  box.innerHTML = ac.items.map((c, i) => {
    const at = c.indexOf(ac.line);
    const hl = at < 0 ? esc(c) : esc(c.slice(0, at)) + `<b>${esc(ac.line)}</b>` + esc(c.slice(at + ac.line.length));
    return `<div class="sg-item${i === ac.sel ? " on" : ""}" data-i="${i}"><span class="sg-text">${hl}</span>${i === ac.sel ? `<kbd>→</kbd>` : ""}</div>`;
  }).join("") + `<div class="sg-foot"><kbd>↑</kbd><kbd>↓</kbd> escolher · <kbd>→</kbd> aceitar · <kbd>Esc</kbd> fechar</div>`;
  box.hidden = false;

  // place it under the start of the typed text, or above the line when there's no room below
  const scr = $(".xterm-screen", s.pane).getBoundingClientRect(), pr = s.pane.getBoundingClientRect();
  const cw = scr.width / s.term.cols, ch = scr.height / s.term.rows;
  const b = s.term.buffer.active;
  const col = Math.max(0, b.cursorX - ac.line.length);
  let x = scr.left - pr.left + col * cw - 8;
  let y = scr.top - pr.top + (b.cursorY + 1) * ch + 4;
  const bw = box.offsetWidth, bh = box.offsetHeight;
  x = Math.max(8, Math.min(x, pr.width - bw - 8));
  if (y + bh > pr.height - 8) y = scr.top - pr.top + b.cursorY * ch - bh - 4;
  box.style.left = x + "px";
  box.style.top = Math.max(48, y) + "px";
}

function hideSuggest(s) {
  const box = $(".suggest", s.pane);
  if (box && !box.hidden) box.hidden = true;
  s.ac.items = [];
  s.ac.sel = 0;
}

function acceptSuggest(s, i = s.ac.sel) {
  const ac = s.ac, c = ac.items[i];
  if (!c) return;
  // extend the typed text when it's a prefix; otherwise erase it and type the whole command
  const data = c.startsWith(ac.line) ? c.slice(ac.line.length) : "\x7f".repeat(ac.line.length) + c;
  ac.line = c;
  ac.dismissed = c;
  hideSuggest(s);
  if (data) invoke("write", { sessionId: s.sid, data });
}

/** Keys the popup owns while it's open; returns true when handled (not sent to the server). */
function suggestKey(s, e) {
  const ac = s.ac;
  if ($(".suggest", s.pane).hidden || !ac.items.length) return false;
  if (e.key === "ArrowDown") { ac.sel = (ac.sel + 1) % ac.items.length; renderSuggest(s); return true; }
  if (e.key === "ArrowUp") { ac.sel = (ac.sel - 1 + ac.items.length) % ac.items.length; renderSuggest(s); return true; }
  if (e.key === "ArrowRight") { acceptSuggest(s); return true; }
  if (e.key === "Escape") { ac.dismissed = ac.line; hideSuggest(s); return true; }
  return false;
}

/** Load the server's shell history (bash/zsh/fish) into the suggestions, most recent first. */
async function loadRemoteHistory(s) {
  if (!prefs.autocomplete || !prefs.remoteHistory) return;
  try {
    const remote = await invoke("fetch_history", { sessionId: s.sid });
    if (!Array.isArray(remote)) return;
    const seen = new Set(s.ac.hist);
    s.ac.hist = [...s.ac.hist, ...remote.filter((c) => !seen.has(c) && seen.add(c))];
  } catch { /* no history file / shell without one: suggestions still learn from this session */ }
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
const PREF_DEFAULT = {
  // Tema
  accent: "#0a84ff", wall: "aurora", wallColor: "#0d1017", wallImage: "", wallDim: 0, wallBlur: 0,
  app: 0, blocks: 54, tint: 0, blur: 28,
  // Terminal
  font: "Geist Mono", size: 13.5, lineHeight: 1.2, letterSpacing: 0, weight: "400",
  scheme: "Liquid Glass", cursorStyle: "bar", cursorBlink: true, padding: 14, contrast: false, scrollback: 4000,
  autocomplete: true, remoteHistory: true, smoothScroll: true, renderer: "webgl",
  // Prompt
  promptOn: true, promptStyle: "flags", promptOpacity: 62, promptTwoLines: true, promptDir: "full",
  pUser: true, pDir: true, pGit: true, pDur: true, pStatus: true, pTime: false,
  pcUser: "#64748b", pcDir: "#3b82f6", pcGit: "#22c55e", pcGitDirty: "#eab308", pcDur: "#a855f7", pcErr: "#ef4444", pcTime: "#64748b",
  // Interface
  uiFont: "Geist", uiScale: 100, radius: 18, sideWidth: 268, sidebar: true, density: "comfortable",
  winButtons: "windows", motion: true,
};
let prefs = { ...PREF_DEFAULT };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || "{}")); } catch {}

const termFont = () => `"${prefs.font}", "Geist Mono", Consolas, monospace`;
const termOptions = () => ({
  fontFamily: termFont(),
  fontSize: prefs.size,
  lineHeight: prefs.lineHeight,
  letterSpacing: prefs.letterSpacing,
  fontWeight: prefs.weight,
  fontWeightBold: String(Math.min(900, +prefs.weight + 300)),
  cursorStyle: prefs.cursorStyle,
  cursorBlink: false, // blinking is done by cursorBlinker() below (cheaper than xterm's CSS animation)
  scrollback: prefs.scrollback,
  smoothScrollDuration: prefs.smoothScroll ? 110 : 0,
  minimumContrastRatio: prefs.contrast ? 4.5 : 1,
});

/** true if the font is installed (its metrics differ from both generic fallbacks) */
const fontInstalled = (() => {
  const ctx = document.createElement("canvas").getContext("2d");
  const w = (f) => { ctx.font = `32px ${f}`; return ctx.measureText("mmmmmmmmmmlli10WQ@").width; };
  return (name) => ["monospace", "serif"].some((g) => w(`"${name}", ${g}`) !== w(g));
})();

/* Wallpapers: static layered gradients (painted once, no animation, so they cost nothing at runtime). */
const WALLS = {
  aurora: { name: "Aurora", css: "radial-gradient(60% 55% at 12% 8%, rgba(10,132,255,.32), transparent 70%), radial-gradient(50% 50% at 92% 18%, rgba(191,90,242,.24), transparent 70%), radial-gradient(55% 60% at 78% 100%, rgba(48,209,88,.14), transparent 70%), radial-gradient(45% 45% at 20% 95%, rgba(255,55,95,.14), transparent 70%), linear-gradient(180deg, #0b0d14, #07080c)" },
  midnight: { name: "Meia-noite", css: "radial-gradient(70% 60% at 15% 0%, rgba(94,92,230,.38), transparent 70%), radial-gradient(60% 60% at 100% 100%, rgba(10,60,160,.35), transparent 70%), linear-gradient(160deg, #0a0b1f, #05060d)" },
  ocean: { name: "Oceano", css: "radial-gradient(65% 60% at 10% 10%, rgba(100,210,255,.30), transparent 70%), radial-gradient(60% 60% at 90% 90%, rgba(0,120,140,.35), transparent 70%), linear-gradient(170deg, #06141c, #03090e)" },
  sunset: { name: "Pôr do sol", css: "radial-gradient(60% 55% at 10% 5%, rgba(255,159,10,.32), transparent 70%), radial-gradient(55% 55% at 95% 25%, rgba(255,55,95,.30), transparent 70%), radial-gradient(60% 60% at 60% 110%, rgba(120,40,160,.30), transparent 70%), linear-gradient(180deg, #170b10, #0b0608)" },
  forest: { name: "Floresta", css: "radial-gradient(60% 60% at 10% 10%, rgba(48,209,88,.24), transparent 70%), radial-gradient(60% 60% at 95% 90%, rgba(20,110,80,.32), transparent 70%), linear-gradient(170deg, #07140d, #040a07)" },
  rose: { name: "Rosé", css: "radial-gradient(60% 55% at 15% 10%, rgba(255,55,95,.30), transparent 70%), radial-gradient(55% 55% at 90% 85%, rgba(191,90,242,.26), transparent 70%), linear-gradient(170deg, #160a12, #0a0509)" },
  graphite: { name: "Grafite", css: "radial-gradient(70% 60% at 20% 0%, rgba(255,255,255,.08), transparent 70%), linear-gradient(180deg, #16171b, #0c0d10)" },
  black: { name: "Preto", css: "#000" },
  solid: { name: "Cor sólida" },
  image: { name: "Imagem" },
};
const wallCss = (k = prefs.wall) =>
  k === "solid" ? prefs.wallColor
  : k === "image" ? (prefs.wallImage ? `center / cover no-repeat url("${prefs.wallImage}")` : WALLS.aurora.css)
  : (WALLS[k] || WALLS.aurora).css;

/* One-click looks: each preset only sets the keys it lists. */
const PRESETS = [
  { name: "Liquid Glass", v: { accent: "#0a84ff", wall: "aurora", scheme: "Liquid Glass", tint: 0, blocks: 54, radius: 18, font: "Geist Mono", cursorStyle: "bar" } },
  { name: "Meia-noite", v: { accent: "#5e5ce6", wall: "midnight", scheme: "One Half Dark", tint: 30, blocks: 50, radius: 18 } },
  { name: "Oceano", v: { accent: "#64d2ff", wall: "ocean", scheme: "Solarized Dark", tint: 30, blocks: 50, radius: 18 } },
  { name: "Pôr do sol", v: { accent: "#ff9f0a", wall: "sunset", scheme: "Liquid Glass", tint: 25, blocks: 54, radius: 18 } },
  { name: "Floresta", v: { accent: "#30d158", wall: "forest", scheme: "Tango Dark", tint: 25, blocks: 54, radius: 18 } },
  { name: "Rosé", v: { accent: "#ff375f", wall: "rose", scheme: "Liquid Glass", tint: 30, blocks: 54, radius: 22 } },
  { name: "Grafite", v: { accent: "#8e8e93", wall: "graphite", scheme: "Dark+", tint: 0, blocks: 25, radius: 12 } },
  { name: "Clássico", v: { accent: "#3b78ff", wall: "black", scheme: "Campbell", tint: 0, blocks: 0, radius: 4, font: "Cascadia Mono", cursorStyle: "block" } },
];

const ACCENTS = ["#0a84ff", "#5e5ce6", "#bf5af2", "#ff375f", "#ff453a", "#ff9f0a", "#ffd60a", "#30d158", "#64d2ff", "#8e8e93"];

const UI_FONTS = [
  { name: "Geist", tag: "padrão" },
  { name: "Segoe UI" },
  { name: "Segoe UI Variable" },
  { name: "Bahnschrift" },
  { name: "Trebuchet MS" },
  { name: "Verdana" },
  { name: "Tahoma" },
  { name: "Arial" },
  { name: "Georgia" },
  { name: "Geist Mono", tag: "mono" },
];

const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));

function applyPrefs(save = true) {
  const r = document.documentElement.style;
  const accent = /^#[0-9a-f]{6}$/i.test(prefs.accent) ? prefs.accent : PREF_DEFAULT.accent;
  r.setProperty("--accent", accent);
  r.setProperty("--on-accent", isLight(accent) ? "#000" : "#fff");

  // wallpaper
  r.setProperty("--wall-a", String(1 - prefs.app / 100));
  r.setProperty("--wall-dim", String(prefs.wallDim / 100));
  r.setProperty("--wall-blur", prefs.wallBlur + "px");
  $(".wallpaper").style.background = wallCss();

  // glass: transparency, accent tint, blur strength
  const a = 1 - prefs.blocks / 100;
  const tint = (prefs.tint / 100) * 0.35;
  const g1 = mix([28, 30, 38], rgb(accent), tint), g2 = mix([30, 32, 42], rgb(accent), tint);
  r.setProperty("--glass", `rgba(${g1.join(",")}, ${a.toFixed(3)})`);
  r.setProperty("--glass-strong", `rgba(${g2.join(",")}, ${Math.min(1, a + 0.26).toFixed(3)})`);
  r.setProperty("--blur", prefs.blur + "px");

  // the terminal area takes the scheme's background color, at the blocks' transparency
  const sc = schemeOf();
  const bg = sc.bg ? rgb(sc.bg).join(", ") : "12, 14, 20";
  r.setProperty("--stage-bg", `rgba(${bg}, ${Math.min(1, a + 0.16).toFixed(3)})`);
  $("#stage").classList.toggle("light", !!sc.bg && isLight(sc.bg));
  r.setProperty("--term-pad", prefs.padding + "px");

  // interface
  r.setProperty("--sans", `"${prefs.uiFont}", "Geist", "Segoe UI", system-ui, sans-serif`);
  r.setProperty("--radius", prefs.radius + "px");
  r.setProperty("--win-radius", Math.min(14, Math.round(prefs.radius * 0.67)) + "px");
  r.setProperty("--side-w", prefs.sideWidth + "px");
  const b = document.body.classList;
  b.toggle("no-side", !prefs.sidebar);
  b.toggle("compact", prefs.density === "compact");
  b.toggle("mac", prefs.winButtons === "mac");
  b.toggle("nomotion", !prefs.motion);
  $("#sideBtn")?.classList.toggle("on", !prefs.sidebar);
  setUiScale(prefs.uiScale / 100);

  for (const s of sessions.values()) {
    if (s.scheme !== sc.name) { s.term.options.theme = termTheme(); s.scheme = sc.name; }
    const o = termOptions();
    if (s.webgl) o.cursorBlink = prefs.cursorBlink;
    for (const k in o) if (s.term.options[k] !== o[k]) s.term.options[k] = o[k];
    if (!s.pane.hidden) try { s.fit.fit(); } catch {}
    if (!prefs.autocomplete) hideSuggest(s);
  }
  if (save) {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); }
    catch { toast("Não deu para salvar — a imagem de fundo é grande demais"); }
  }
}

/** Interface scale: real webview zoom in the app (crisp, xterm-friendly); CSS zoom in the browser preview. */
let lastScale = 1;
function setUiScale(f) {
  if (f === lastScale) return;
  lastScale = f;
  if (T?.webview?.getCurrentWebview) T.webview.getCurrentWebview().setZoom(f).catch(() => {});
  else document.body.style.zoom = f === 1 ? "" : String(f);
}

const RST_LABEL = {
  app: (v) => v + "%", blocks: (v) => v + "%", tint: (v) => v + "%", blur: (v) => v + " px", wallDim: (v) => v + "%", wallBlur: (v) => v + " px",
  size: (v) => v + " px", lineHeight: (v) => v.toFixed(2), letterSpacing: (v) => v + " px", padding: (v) => v + " px",
  uiScale: (v) => v + "%", radius: (v) => v + " px", sideWidth: (v) => v + " px",
};
const rstLabel = (k) => (RST_LABEL[k] ? RST_LABEL[k](PREF_DEFAULT[k]) : String(PREF_DEFAULT[k]));

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
  if (!list) return;
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

/* ---------- modern prompt (powerline "flags") ----------
   The shell side lives in src-tauri/src/prompt.bash. The app computes the colors (each segment color is
   blended with the terminal background by "Opacidade", text color picked for contrast) and sends them at
   connect time; the prompt reports folder + git back through OSC 7 / OSC 6973, shown in the bar and tab. */
const PROMPT_SEGS = [
  ["pUser", "user", "Usuário e máquina"],
  ["pDir", "dir", "Pasta"],
  ["pGit", "git", "Git"],
  ["pDur", "dur", "Duração do comando"],
  ["pStatus", "status", "Código de erro"],
  ["pTime", "time", "Hora"],
];
const PROMPT_COLORS = [
  ["pcUser", "user", "Usuário"],
  ["pcDir", "dir", "Pasta"],
  ["pcGit", "git", "Git (limpo)"],
  ["pcGitDirty", "gitd", "Git (alterações)"],
  ["pcDur", "dur", "Duração"],
  ["pcErr", "err", "Erro"],
  ["pcTime", "time", "Hora"],
];
const PROMPT_SWATCHES = ["#64748b", "#3b82f6", "#0a84ff", "#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7", "#ec4899", "#14b8a6", "#1e293b"];

const termBg = () => schemeOf().bg || "#0c0e14";
const blendHex = (hex, a) => mix(rgb(termBg()), rgb(hex), a);
const contrastFg = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] > 150 ? [24, 24, 28] : [244, 245, 248]);

/** Segment colors as the prompt will draw them (shared by the config sent to the server and the preview). */
function promptPalette() {
  const a = prefs.promptOpacity / 100, out = {};
  for (const [k, id] of PROMPT_COLORS) {
    const base = /^#[0-9a-f]{6}$/i.test(prefs[k]) ? prefs[k] : PREF_DEFAULT[k];
    const bg = prefs.promptStyle === "plain" ? rgb(base) : blendHex(base, a);
    out[id] = { bg, fg: contrastFg(bg) };
  }
  return out;
}

/** Config for the backend (keys/values are re-validated in Rust). null = start the normal shell. */
function promptConfig() {
  if (!prefs.promptOn) return null;
  const pal = promptPalette(), cfg = {
    style: prefs.promptStyle,
    two: prefs.promptTwoLines ? "1" : "0",
    dirmode: prefs.promptDir,
    segs: PROMPT_SEGS.filter(([k]) => prefs[k]).map(([, id]) => id).join(" "),
    c_ok: "74;222;128",
    c_bad: "248;113;113",
  };
  for (const [id, c] of Object.entries(pal)) { cfg[`c_${id}_bg`] = c.bg.join(";"); cfg[`c_${id}_fg`] = c.fg.join(";"); }
  return cfg;
}

/** Listen for the folder / git reports the prompt prints (invisible OSC sequences). */
function setupShellIntegration(s) {
  const p = s.term.parser;
  p.registerOscHandler(7, (data) => {
    try { s.cwdAbs = decodeURIComponent(new URL(data).pathname); } catch {}
    return true;
  });
  p.registerOscHandler(6973, (data) => {
    if (data.startsWith("cwd=")) s.cwd = data.slice(4);
    else if (data.startsWith("git=")) {
      const [branch, staged, modified, untracked, ahead, behind, conflicts] = data.slice(4).split("|");
      s.git = branch ? { branch, staged: +staged, modified: +modified, untracked: +untracked, ahead: +ahead, behind: +behind, conflicts: +conflicts } : null;
      updateLocation(s);
    }
    return true;
  });
}

function updateLocation(s) {
  const crumb = $('[data-r="crumb"]', s.pane), gchip = $('[data-r="git"]', s.pane);
  if (s.cwd) {
    crumb.hidden = false;
    $("span", crumb).textContent = s.cwd;
    crumb.title = `${s.cwdAbs || s.cwd} — clique para copiar`;
  }
  if (s.git) {
    const g = s.git, dirty = g.staged + g.modified + g.untracked + g.conflicts > 0;
    const bits = [g.conflicts && `✖${g.conflicts}`, g.staged && `✚${g.staged}`, g.modified && `●${g.modified}`, g.untracked && `?${g.untracked}`, g.ahead && `⇡${g.ahead}`, g.behind && `⇣${g.behind}`].filter(Boolean).join(" ");
    gchip.hidden = false;
    gchip.classList.toggle("dirty", dirty);
    gchip.innerHTML = `<span class="g-br">⎇ ${esc(g.branch)}</span>${bits ? `<span class="g-st">${esc(bits)}</span>` : ""}`;
    gchip.title = dirty ? "Repositório com alterações" : "Repositório limpo";
  } else gchip.hidden = true;
  // tab: machine name + current folder
  const leaf = s.cwd && s.cwd !== "~" ? s.cwd.split("/").filter(Boolean).pop() : "";
  $(".tname", s.tab).textContent = leaf ? `${s.host.name} · ${leaf}` : s.host.name;
}

/* --- Personalizar → Prompt --- */
function promptPreviewHtml(sample) {
  const pal = promptPalette(), style = prefs.promptStyle;
  const css = (c) => `rgb(${c.join(",")})`;
  const segs = [];
  if (prefs.pUser) segs.push(["user", "joao@fedora"]);
  if (prefs.pDir) segs.push(["dir", prefs.promptDir === "short" ? "…/projetos/app" : "~/projetos/app"]);
  if (prefs.pGit) segs.push(sample.dirty ? ["gitd", "⎇ main ✚1 ●2 ?1"] : ["git", "⎇ main"]);
  if (prefs.pDur && sample.dur) segs.push(["dur", "12s"]);
  if (prefs.pStatus && sample.err) segs.push(["err", "✘ 1"]);
  if (prefs.pTime) segs.push(["time", "14:32"]);
  let out = "";
  if (style === "plain") {
    out = segs.map(([id, t]) => `<b style="color:${css(pal[id].bg)}">${esc(t)}</b>`).join(" ");
  } else {
    segs.forEach(([id, t], i) => {
      const c = pal[id], next = segs[i + 1] && pal[segs[i + 1][0]];
      if (i === 0 && style === "round") out += `<i class="pp-cap-l" style="color:${css(c.bg)}"></i>`;
      out += `<span class="pp-seg" style="background:${css(c.bg)};color:${css(c.fg)}">${esc(t)}</span>`;
      out += `<i class="pp-sep pp-${style}" style="color:${css(c.bg)};background:${next ? css(next.bg) : "transparent"}"></i>`;
    });
  }
  const ok = sample.err ? "rgb(248,113,113)" : "rgb(74,222,128)";
  const cmd = `<span class="pp-cmd">${esc(sample.cmd)}</span>`;
  return prefs.promptTwoLines ? `<div class="pp-line">${out}</div><div class="pp-line"><b style="color:${ok}">❯</b> ${cmd}</div>` : `<div class="pp-line">${out} ${cmd}</div>`;
}

function tabPrompt() {
  const prev = h("div", { class: "pp-preview" });
  prev.style.background = termBg();
  const paint = () => {
    prev.innerHTML = [
      promptPreviewHtml({ dirty: false, cmd: "git pull" }),
      promptPreviewHtml({ dirty: true, err: true, dur: true, cmd: "docker compose up -d" }),
    ].join('<div class="pp-gap"></div>');
    prev.classList.toggle("off", !prefs.promptOn);
  };
  paint();

  const segGrid = h("div", { class: "pp-chips" });
  for (const [k, , label] of PROMPT_SEGS) {
    const b = h("button", { class: "pp-chip" + (prefs[k] ? " on" : "") }, label);
    b.onclick = () => { prefs[k] = !prefs[k]; applyPrefs(); renderPrefs(); };
    segGrid.append(b);
  }

  const colorRows = h("div", { class: "pp-colors" });
  for (const [k, , label] of PROMPT_COLORS) {
    const row = h("div", { class: "pp-crow" }, `<span class="pp-clabel">${label}</span>`);
    const sw = h("div", { class: "swatches pp-sw" });
    for (const c of PROMPT_SWATCHES) {
      const b = h("button", { class: "sw" + (prefs[k].toLowerCase() === c ? " on" : ""), style: `--c:${c}`, title: c });
      b.onclick = () => { prefs[k] = c; applyPrefs(); renderPrefs(); };
      sw.append(b);
    }
    const custom = !PROMPT_SWATCHES.includes(prefs[k].toLowerCase());
    const pick = h("label", { class: "sw sw-custom" + (custom ? " on" : ""), title: "Qualquer cor", style: custom ? `--c:${prefs[k]}` : "" }, `<input type="color" value="${prefs[k]}">`);
    const ci = $("input", pick);
    ci.oninput = () => { prefs[k] = ci.value; applyPrefs(false); paint(); };
    ci.onchange = () => { applyPrefs(); renderPrefs(); };
    sw.append(pick);
    row.append(sw);
    colorRows.append(row);
  }

  const s = sessions.get(activeSid);
  const applyRow = h("div", { class: "pp-apply" }, `<span class="phint2">Vale para as próximas conexões — nada é alterado no servidor. Funciona com bash; zsh e fish ficam com o prompt de vocês.</span>`);
  if (s && (s.state === "connected" || s.state === "closed" || s.state === "error")) {
    const b = h("button", { class: "btn" }, "Reconectar esta aba");
    b.onclick = () => { reconnect(s); togglePrefs(false); };
    applyRow.append(b);
  }

  // live preview: sliders redraw it without rebuilding the whole tab
  const op = ctlSlider("promptOpacity", "Opacidade das flags", { min: 20, max: 100, fmt: (v) => v + "%" });
  $("input", op).addEventListener("input", paint);

  return [
    prev,
    pgroup(ctlToggle("promptOn", "Prompt moderno", "Pasta, git, duração e erro em “flags” coloridas")),
    psec("Estilo"),
    pgroup(
      ctlSeg("promptStyle", "Formato", [["flags", "Setas"], ["round", "Pílulas"], ["slant", "Diagonal"], ["plain", "Texto"]]),
      prefs.promptStyle === "plain" ? null : op,
      ctlSeg("promptTwoLines", "Comando", [[true, "Linha de baixo"], [false, "Mesma linha"]]),
      ctlSeg("promptDir", "Pasta", [["full", "Completa"], ["short", "Curta"]])),
    psec("O que mostrar"),
    segGrid,
    psec("Cores"),
    pgroup(colorRows),
    applyRow,
  ];
}

/* ---------- settings panel (gear) ----------
   Four tabs built from small control builders; every change applies live and is saved to localStorage. */
let prefsTab = "tema";
const PREF_TABS = [["tema", "Tema"], ["terminal", "Terminal"], ["prompt", "Prompt"], ["interface", "Interface"], ["servidores", "Servidores"]];

const isDefault = (k) => JSON.stringify(prefs[k]) === JSON.stringify(PREF_DEFAULT[k]);
const rstBtn = (k) => `<button class="rst${isDefault(k) ? " off" : ""}" data-k="${k}" title="Restaurar padrão (${esc(rstLabel(k))})">${I.undo}</button>`;
const psec = (t) => h("div", { class: "psec" }, t);
function pgroup(...kids) {
  const g = h("div", { class: "pgroup" });
  g.append(...kids.filter(Boolean));
  return g;
}

function ctlSlider(k, label, { min, max, step = 1, fmt = (v) => v, icons }) {
  const el = h("div", { class: "pctl" }, `
    <div class="plabel"><span>${label}</span><span class="pval">${rstBtn(k)}<output></output></span></div>
    <div class="slider-row">${icons ? `<span class="s-ico">${I[icons[0]]}</span>` : ""}<input type="range" class="ios-range" min="${min}" max="${max}" step="${step}">${icons ? `<span class="s-ico">${I[icons[1]]}</span>` : ""}</div>`);
  const inp = $("input", el), out = $("output", el);
  const sync = () => {
    inp.value = prefs[k];
    inp.style.setProperty("--p", (prefs[k] - min) / (max - min));
    out.textContent = fmt(prefs[k]);
    $(".rst", el).classList.toggle("off", isDefault(k));
  };
  inp.oninput = () => { prefs[k] = +inp.value; applyPrefs(false); sync(); };
  inp.onchange = () => applyPrefs();
  sync();
  return el;
}

function ctlSeg(k, label, opts, hint) {
  const el = h("div", { class: "pctl" }, `
    <div class="plabel"><span>${label}</span><span class="pval">${rstBtn(k)}</span></div>
    <div class="seg">${opts.map(([, l]) => `<button>${l}</button>`).join("")}</div>
    ${hint ? `<div class="phint2">${hint}</div>` : ""}`);
  el.querySelectorAll(".seg button").forEach((b, i) => {
    b.classList.toggle("on", String(prefs[k]) === String(opts[i][0]));
    b.onclick = () => { prefs[k] = opts[i][0]; applyPrefs(); renderPrefs(); };
  });
  return el;
}

function ctlToggle(k, label, hint) {
  const el = h("button", { class: "pctl ptoggle" }, `
    <span class="ptext"><span class="plabel"><span>${label}</span></span>${hint ? `<span class="phint2">${hint}</span>` : ""}</span>
    <span class="toggle${prefs[k] ? " on" : ""}"></span>`);
  el.onclick = () => { prefs[k] = !prefs[k]; applyPrefs(); renderPrefs(); };
  return el;
}

function ctlStepper(k, label, { min, max, step, unit }) {
  const el = h("div", { class: "pctl" }, `
    <div class="plabel"><span>${label}</span><span class="pval">${rstBtn(k)}<span class="stepper"><button data-d="-1" title="Diminuir">−</button><output>${prefs[k]}${unit}</output><button data-d="1" title="Aumentar">+</button></span></span></div>`);
  el.querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => {
    prefs[k] = Math.min(max, Math.max(min, Math.round((prefs[k] + step * +b.dataset.d) * 100) / 100));
    applyPrefs();
    renderPrefs();
  }));
  return el;
}

function ctlPicker(k, items, row) {
  const el = h("div", { class: "pgroup flush picker", "data-k": k });
  renderPicker(el, items, prefs[k], row, (it) => { prefs[k] = it.name; applyPrefs(); renderPrefs(); });
  $(".rst", el).outerHTML = rstBtn(k);
  return el;
}

const uiFontRow = (f) => `<span class="pname" style="font-family:'${f.name}', sans-serif">${esc(f.name)}</span>${f.name !== "Geist" && f.name !== "Geist Mono" && !fontInstalled(f.name) ? `<span class="ptag">não detectada</span>` : f.tag ? `<span class="ptag">${f.tag}</span>` : ""}`;

/* --- Tema --- */
function tabTema() {
  const out = [];

  // presets
  const grid = h("div", { class: "preset-grid" });
  for (const p of PRESETS) {
    const active = Object.entries(p.v).every(([k, v]) => prefs[k] === v);
    const b = h("button", { class: "preset" + (active ? " on" : "") }, `
      <span class="preset-prev" style="background:${wallCss(p.v.wall).replace(/"/g, "'")}">
        <i style="background:${p.v.accent}"></i><b></b><b></b>
      </span><span class="preset-name">${esc(p.name)}</span>`);
    b.onclick = () => { Object.assign(prefs, p.v); applyPrefs(); renderPrefs(); toast(`Tema “${p.name}” aplicado`); };
    grid.append(b);
  }
  out.push(psec("Temas prontos"), grid);

  // accent
  const sw = h("div", { class: "swatches accent-sw" });
  for (const c of ACCENTS) {
    const b = h("button", { class: "sw" + (prefs.accent.toLowerCase() === c ? " on" : ""), style: `--c:${c}`, title: c });
    b.onclick = () => { prefs.accent = c; applyPrefs(); renderPrefs(); };
    sw.append(b);
  }
  const custom = !ACCENTS.includes(prefs.accent.toLowerCase());
  const pick = h("label", { class: "sw sw-custom" + (custom ? " on" : ""), title: "Escolher qualquer cor", style: custom ? `--c:${prefs.accent}` : "" }, `<input type="color" value="${prefs.accent}">`);
  const ci = $("input", pick);
  ci.oninput = () => { prefs.accent = ci.value; applyPrefs(false); pick.style.setProperty("--c", ci.value); };
  ci.onchange = () => { applyPrefs(); renderPrefs(); };
  sw.append(pick);
  const accHead = h("div", { class: "plabel" }, `<span>Cor de destaque</span><span class="pval">${rstBtn("accent")}<output>${esc(prefs.accent.toUpperCase())}</output></span>`);
  out.push(psec("Cores"), pgroup(accHead, sw, ctlSlider("tint", "Cor no vidro", { min: 0, max: 100, fmt: (v) => v + "%" })));

  // wallpaper
  const walls = h("div", { class: "wall-grid" });
  for (const [k, w] of Object.entries(WALLS)) {
    let prev = wallCss(k), inner = "";
    if (k === "image" && !prefs.wallImage) { prev = "rgba(255,255,255,.06)"; inner = I.image; }
    if (k === "solid") inner = `<input type="color" value="${prefs.wallColor}" title="Escolher cor">`;
    const t = h("button", { class: "wall-tile" + (prefs.wall === k ? " on" : ""), title: w.name }, `<span class="wall-prev" style="background:${prev.replace(/"/g, "'")}">${inner}</span><span class="wall-name">${w.name}</span>`);
    if (k === "solid") {
      const inp = $("input", t);
      inp.oninput = () => { prefs.wallColor = inp.value; prefs.wall = "solid"; applyPrefs(false); $(".wall-prev", t).style.background = inp.value; };
      inp.onchange = () => { applyPrefs(); renderPrefs(); };
      t.onclick = (e) => { if (e.target === inp) return; prefs.wall = "solid"; applyPrefs(); renderPrefs(); };
    } else if (k === "image") {
      t.onclick = () => { if (prefs.wallImage && prefs.wall !== "image") { prefs.wall = "image"; applyPrefs(); renderPrefs(); } else { $("#wallFile").value = ""; $("#wallFile").click(); } };
    } else {
      t.onclick = () => { prefs.wall = k; applyPrefs(); renderPrefs(); };
    }
    walls.append(t);
  }
  const wallKids = [walls];
  if (prefs.wall === "image" && prefs.wallImage) {
    const row = h("div", { class: "wall-actions" }, `<button class="pbtn" data-a="swap">${I.image}Trocar imagem</button><button class="pbtn" data-a="del">${I.trash}Remover</button>`);
    $('[data-a="swap"]', row).onclick = () => { $("#wallFile").value = ""; $("#wallFile").click(); };
    $('[data-a="del"]', row).onclick = () => { prefs.wallImage = ""; prefs.wall = "aurora"; applyPrefs(); renderPrefs(); };
    wallKids.push(row);
  }
  out.push(psec("Papel de parede"), pgroup(...wallKids,
    ctlSlider("wallDim", "Escurecer", { min: 0, max: 85, fmt: (v) => v + "%" }),
    ctlSlider("wallBlur", "Desfocar fundo", { min: 0, max: 40, fmt: (v) => v + " px" })));

  // glass
  out.push(psec("Vidro"), pgroup(
    ctlSlider("app", "Transparência do app", { min: 0, max: 90, fmt: (v) => v + "%", icons: ["solid", "clear"] }),
    ctlSlider("blocks", "Transparência dos blocos", { min: 0, max: 100, fmt: (v) => v + "%", icons: ["solid", "clear"] }),
    ctlSlider("blur", "Desfoque do vidro", { min: 0, max: 60, fmt: (v) => v + " px" })));
  return out;
}

/* --- Terminal --- */
function tabTerminal() {
  return [
    psec("Fonte"),
    ctlPicker("font", FONTS, fontRow),
    pgroup(
      ctlStepper("size", "Tamanho", { min: 9, max: 24, step: 0.5, unit: "px" }),
      ctlSeg("weight", "Peso", [["300", "Fina"], ["400", "Normal"], ["500", "Média"], ["600", "Forte"]]),
      ctlSlider("lineHeight", "Altura da linha", { min: 1, max: 2, step: 0.05, fmt: (v) => (+v).toFixed(2) }),
      ctlSlider("letterSpacing", "Espaço entre letras", { min: -1, max: 4, step: 0.5, fmt: (v) => v + " px" })),
    psec("Esquema de cores"),
    ctlPicker("scheme", SCHEMES, schemeRow),
    pgroup(ctlToggle("contrast", "Contraste mínimo", "Clareia cores que ficariam ilegíveis no fundo")),
    psec("Cursor"),
    pgroup(
      ctlSeg("cursorStyle", "Formato", [["bar", "Barra"], ["block", "Bloco"], ["underline", "Sublinhado"]]),
      ctlToggle("cursorBlink", "Cursor piscando")),
    psec("Sugestões de comandos"),
    pgroup(
      ctlToggle("autocomplete", "Sugerir enquanto digito", "↑↓ escolhe, → aceita, Esc fecha. O Tab continua sendo o autocomplete do shell"),
      prefs.autocomplete ? ctlToggle("remoteHistory", "Usar o histórico do servidor", "Lê ~/.bash_history, ~/.zsh_history ou o do fish ao conectar. Fica só na memória") : null),
    psec("Área do terminal"),
    pgroup(
      ctlSlider("padding", "Margem interna", { min: 0, max: 40, fmt: (v) => v + " px" }),
      ctlToggle("smoothScroll", "Rolagem suave", "Anima a rolagem com a roda do mouse"),
      ctlSeg("scrollback", "Histórico de linhas", [[1000, "1 mil"], [4000, "4 mil"], [10000, "10 mil"], [25000, "25 mil"]], "Mais histórico = mais memória por aba aberta")),
  ];
}

/* --- Interface --- */
function tabInterface() {
  return [
    psec("Texto da interface"),
    ctlPicker("uiFont", UI_FONTS, uiFontRow),
    pgroup(ctlSlider("uiScale", "Escala", { min: 80, max: 140, step: 5, fmt: (v) => v + "%" })),
    psec("Formas"),
    pgroup(
      ctlSlider("radius", "Arredondamento", { min: 0, max: 28, fmt: (v) => v + " px" }),
      ctlSeg("density", "Densidade", [["comfortable", "Confortável"], ["compact", "Compacta"]])),
    psec("Barra lateral"),
    pgroup(
      ctlToggle("sidebar", "Mostrar barra lateral", "Atalho: Ctrl+Shift+B"),
      prefs.sidebar ? ctlSlider("sideWidth", "Largura", { min: 200, max: 380, step: 4, fmt: (v) => v + " px" }) : null),
    psec("Janela"),
    pgroup(
      ctlSeg("winButtons", "Botões da janela", [["windows", "Windows"], ["mac", "macOS"]]),
      ctlToggle("motion", "Animações", "Desligue para uma interface mais seca e leve")),
  ];
}

/* --- Servidores --- */
function tabServidores() {
  const list = h("div", { class: "pgroup flush", id: "iconList" });
  const hint = h("p", { class: "phint" }, "Sugestão: imagem quadrada de <b>128 × 128 px</b> ou maior (PNG, JPG, WebP ou SVG). Imagens retangulares são recortadas no centro. Também dá para arrastar a imagem até a linha.");
  return [psec("Ícones dos servidores"), list, hint];
}

function renderPrefs() {
  const tabs = $("#prefsTabs");
  tabs.innerHTML = "";
  for (const [id, label] of PREF_TABS) {
    const b = h("button", { class: prefsTab === id ? "on" : "" }, label);
    b.onclick = () => { prefsTab = id; $("#prefsBody").scrollTop = 0; renderPrefs(); };
    tabs.append(b);
  }
  const body = $("#prefsBody");
  const keep = body.scrollTop;
  body.innerHTML = "";
  body.append(...{ tema: tabTema, terminal: tabTerminal, prompt: tabPrompt, interface: tabInterface, servidores: tabServidores }[prefsTab]());
  if (prefsTab === "servidores") renderIconList();
  body.scrollTop = keep;
}

// one handler for every "back to default" arrow
$("#prefs").addEventListener("click", (e) => {
  const k = e.target.closest(".rst")?.dataset.k;
  if (!k) return;
  e.stopPropagation();
  prefs[k] = PREF_DEFAULT[k];
  applyPrefs();
  renderPrefs();
});

function togglePrefs(force) {
  const p = $("#prefs");
  const on = force ?? !p.classList.contains("on");
  if (on === p.classList.contains("on")) return;
  if (on) { toggleClip(false); renderPrefs(); }
  p.classList.toggle("on", on);
  $("#setBtn").classList.toggle("on", on);
  if (!on) sessions.get(activeSid)?.term.focus();
}

/* wallpaper image: downscaled to at most 1920 px wide JPEG so it fits in localStorage */
async function imageToWallpaper(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 1920 / (img.naturalWidth || 1920));
    const c = document.createElement("canvas");
    c.width = Math.round((img.naturalWidth || 1920) * scale);
    c.height = Math.round((img.naturalHeight || 1080) * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    for (const q of [0.85, 0.7, 0.55]) {
      const d = c.toDataURL("image/jpeg", q);
      if (d.length < 1_800_000) return d;
    }
    return c.toDataURL("image/jpeg", 0.4);
  } finally {
    URL.revokeObjectURL(url);
  }
}
$("#wallFile").onchange = async (e) => {
  const f = e.target.files[0];
  if (!f || !f.type.startsWith("image/")) return;
  try {
    prefs.wallImage = await imageToWallpaper(f);
    prefs.wall = "image";
    applyPrefs();
    renderPrefs();
  } catch { toast("Não consegui ler essa imagem"); }
};

/* export / import (via clipboard, as JSON). The wallpaper image stays out to keep it shareable. */
$("#prefsExport").onclick = async () => {
  const { wallImage, ...rest } = prefs;
  await invoke("clip_write", { text: JSON.stringify({ sshConnectorTheme: 1, prefs: rest }, null, 2) });
  toast("Tema copiado — cole em outro PC e use Importar");
};
$("#prefsImport").onclick = async () => {
  let data;
  try { data = JSON.parse((await invoke("clip_read")) || ""); } catch { return toast("A área de transferência não tem um tema válido"); }
  const src = data?.prefs;
  if (!data?.sshConnectorTheme || !src || typeof src !== "object") return toast("A área de transferência não tem um tema válido");
  let n = 0;
  for (const [k, v] of Object.entries(src)) {
    if (k in PREF_DEFAULT && k !== "wallImage" && typeof v === typeof PREF_DEFAULT[k]) { prefs[k] = v; n++; }
  }
  if (prefs.wall === "image" && !prefs.wallImage) prefs.wall = "aurora";
  applyPrefs();
  renderPrefs();
  toast(`Tema importado (${n} ajustes)`);
};
$("#prefsReset").onclick = () => {
  const btn = $("#prefsReset");
  if (!btn.dataset.armed) {
    btn.dataset.armed = "1";
    btn.textContent = "Confirmar";
    setTimeout(() => { delete btn.dataset.armed; btn.textContent = "Restaurar tudo"; }, 3000);
    return;
  }
  prefs = { ...PREF_DEFAULT };
  applyPrefs();
  renderPrefs();
  delete btn.dataset.armed;
  btn.textContent = "Restaurar tudo";
  toast("Aparência restaurada");
};

$("#setBtn").innerHTML = I.gear;
$("#setBtn").onclick = () => togglePrefs();
$("#sideBtn").innerHTML = I.sidebar;
$("#sideBtn").onclick = () => { prefs.sidebar = !prefs.sidebar; applyPrefs(); if ($("#prefs").classList.contains("on")) renderPrefs(); };
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
    { label: "Buscar", key: "Ctrl+Shift+F", icon: I.search, run: () => openFind(s) },
    { label: "Área de transferência", key: "Ctrl+Shift+V", icon: I.clip, run: () => toggleClip(true) },
    { label: "Selecionar tudo", key: "Ctrl+Shift+A", icon: I.selectAll, run: () => s.term.selectAll() },
    { label: "Limpar tela", icon: I.eraser, run: () => s.term.clear() },
  ];
  const m = h("div", { class: "ctx glass-strong", id: "ctx" });
  for (const it of items) {
    if (it === "-") { m.append(h("div", { class: "ctx-sep" })); continue; }
    const b = h("button", { class: "ctx-item" }, `${it.icon}<span>${it.label}</span>${it.key ? `<kbd>${it.key}</kbd>` : ""}`);
    if (it.off) b.disabled = true;
    b.onclick = () => { closeMenu(); it.run(); if (!["Área de transferência", "Buscar"].includes(it.label)) s.term.focus(); };
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
  else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "b") { e.preventDefault(); $("#sideBtn").click(); }
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

/** Mirrors prompt.bash's rendering for the browser preview (escape sequences + OSC reports). */
function mockPrompt(cfg, dir, git, ec = 0) {
  if (!cfg) return "\x1b[1;32madmin@fedora\x1b[0m:\x1b[1;34m" + dir + "\x1b[0m$ ";
  const style = cfg.style, segsOn = cfg.segs.split(" ");
  const sep = { flags: "\ue0b0", round: "\ue0b4", slant: "\ue0bc", plain: "" }[style], cap = { round: "\ue0b6", slant: "\ue0ba" }[style] || "";
  const e = (c) => `\x1b[${c}m`;
  let out = "", prev = "";
  const seg = (id, text) => {
    const bg = cfg[`c_${id}_bg`], fg = cfg[`c_${id}_fg`];
    if (style === "plain") { out += (out ? " " : "") + e(`1;38;2;${bg}`) + text + e(0); return; }
    out += prev ? e(`38;2;${prev};48;2;${bg}`) + sep : cap ? e(`0;38;2;${bg}`) + cap : "";
    out += e(`0;48;2;${bg};38;2;${fg}`) + ` ${text} `;
    prev = bg;
  };
  if (segsOn.includes("user")) seg("user", "admin@fedora");
  if (segsOn.includes("dir")) seg("dir", cfg.dirmode === "short" && dir.split("/").length > 3 ? "…/" + dir.split("/").slice(-2).join("/") : dir);
  const dirty = git && (git.modified || git.untracked);
  if (git && segsOn.includes("git")) seg(dirty ? "gitd" : "git", `⎇ ${git.branch}${git.modified ? " ●" + git.modified : ""}${git.untracked ? " ?" + git.untracked : ""}`);
  if (ec && segsOn.includes("status")) seg("err", `✘ ${ec}`);
  if (style !== "plain" && prev) out += e(`0;38;2;${prev}`) + (sep || "\ue0b0") + e(0);
  const osc = `\x1b]6973;cwd=${dir}\x07\x1b]6973;git=${git ? `${git.branch}|0|${git.modified || 0}|${git.untracked || 0}|0|0|0` : ""}\x07`;
  const line2 = cfg.two === "1" ? "\r\n" + e(`1;38;2;${ec ? cfg.c_bad : cfg.c_ok}`) + "❯" + e(0) + " " : " ";
  return osc + "\r\n" + out + line2;
}

function mockInvoke(cmd, args) {
  const db = (mockInvoke.db ||= [
    { id: "1", name: "Fedora Server", host: "192.168.1.20", port: 22, user: "admin", auth: "key", keyPath: "", color: "#5ac8fa", hasSecret: false },
    { id: "2", name: "Proxmox", host: "192.168.1.10", port: 22, user: "root", auth: "key", keyPath: "", color: "#ff9f0a", hasSecret: false },
    { id: "3", name: "Pi-hole", host: "192.168.1.53", port: 22, user: "pi", auth: "password", keyPath: "", color: "#ff453a", hasSecret: true },
    { id: "4", name: "NAS", host: "192.168.1.40", port: 2222, user: "admin", auth: "key", keyPath: "", color: "#30d158", hasSecret: false },
    { id: "5", name: "Home Assistant", host: "192.168.1.60", port: 22, user: "hass", auth: "password", keyPath: "", color: "#bf5af2", hasSecret: true },
  ]);
  const ping = { "192.168.1.20": 2, "192.168.1.10": 1, "192.168.1.53": 3, "192.168.1.40": 4, "192.168.1.60": null };
  if (cmd === "connect") mockInvoke.promptCfg = args.prompt;
  const P = mockPrompt(mockInvoke.promptCfg, "~/projetos/app", { branch: "main", modified: 2, untracked: 1 });
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
    case "connect": mockInvoke.ch = args.onEvent; setTimeout(() => { args.onEvent.onmessage({ type: "status", state: "connected", message: "" }); args.onEvent.onmessage({ type: "data", data: demo }); }, 400); return Promise.resolve();
    case "write": {
      const ch = mockInvoke.ch;
      if (ch) ch.onmessage({ type: "data", data: args.data.replace(/\r/g, "\r\n" + P).replace(/\x7f/g, "\b \b") });
      return Promise.resolve(null);
    }
    case "fetch_history": return Promise.resolve(["sudo dnf upgrade -y", "docker compose pull", "docker compose up -d", "docker ps --format 'table {{.Names}}\t{{.Status}}'", "docker logs -f jellyfin", "systemctl status nginx", "journalctl -u nginx --since \"10 min ago\"", "df -h /srv", "htop", "sudo reboot"]);
    case "resize": mockInvoke.resizes = (mockInvoke.resizes || 0) + 1; return Promise.resolve(null);
    case "clip_write": mockInvoke.clip = args.text; return Promise.resolve(null);
    case "clip_read": return Promise.resolve(mockInvoke.clip || "");
    default: return Promise.resolve(null);
  }
}
