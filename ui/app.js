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
      <div class="avatar" style="--c:${esc(host.color)}">${esc(initials(host.name))}<span class="dot ${p === undefined ? "" : p === null ? "off" : "on"}"></span></div>
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
      <div class="avatar" style="--c:${esc(host.color)}">${esc(initials(host.name))}<span class="dot ${p === undefined ? "" : p === null ? "off" : "on"}"></span></div>
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
      <div class="avatar" style="--c:${esc(host.color)};width:26px;height:26px;border-radius:8px;font-size:11px">${esc(initials(host.name))}</div>
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
    fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--mono"),
    fontSize: 13.5,
    lineHeight: 1.2,
    cursorBlink: true,
    cursorStyle: "bar",
    allowTransparency: true,
    scrollback: 4000,
    theme: THEME,
    macOptionIsMeta: true,
    rightClickSelectsWord: false,
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.loadAddon(new WebLinksAddon.WebLinksAddon());
  term.open($(".term", pane));

  const s = { sid, hostId: host.id, host, term, fit, pane, state: "idle", tab: null };
  sessions.set(sid, s);

  // keyboard: Ctrl+Shift+C copy, Ctrl+Shift+V / Ctrl+V paste (Ctrl+C stays SIGINT)
  term.attachCustomKeyEventHandler((e) => {
    if (e.type !== "keydown") return true;
    const k = e.key.toLowerCase();
    if (e.ctrlKey && e.shiftKey && k === "c") { e.preventDefault(); copySel(s); return false; }
    if (e.ctrlKey && k === "v") { e.preventDefault(); paste(s); return false; }
    if (e.ctrlKey && e.shiftKey && k === "w") { e.preventDefault(); closeSession(sid); return false; }
    if (e.ctrlKey && k === "tab") { e.preventDefault(); cycle(e.shiftKey ? -1 : 1); return false; }
    return true;
  });
  $(".term", pane).addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (term.hasSelection()) { copySel(s); term.clearSelection(); } else paste(s);
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
      case "data": s.term.write(ev.data); break;
      case "status":
        setState(s, ev.state, ev.message);
        if (ev.state === "connected") {
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

async function copySel(s) {
  const t = s.term.getSelection();
  if (t) { await invoke("clip_write", { text: t }); toast("Copiado"); }
}
async function paste(s) {
  if (s.state !== "connected") return;
  const t = await invoke("clip_read");
  if (t) s.term.paste(t);
}

function toast(msg) {
  const t = h("div", { class: "toast" }, esc(msg));
  $("#toasts").append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 2600);
}

/* ---------- global shortcuts ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#sheet").classList.contains("on")) { e.preventDefault(); closeSheet(); }
  else if (e.ctrlKey && e.key.toLowerCase() === "n") { e.preventDefault(); openEditor(); }
  else if (e.ctrlKey && e.key.toLowerCase() === "f" && !$("#sheet").classList.contains("on")) { e.preventDefault(); $("#search").focus(); }
  else if (e.ctrlKey && e.key === "Tab") { e.preventDefault(); cycle(e.shiftKey ? -1 : 1); }
  // block webview reload / devtools / zoom shortcuts
  else if (e.key === "F5" || (e.ctrlKey && ["r", "p", "u", "j"].includes(e.key.toLowerCase()))) e.preventDefault();
});
document.addEventListener("contextmenu", (e) => { if (!e.target.closest("input")) e.preventDefault(); });

loadHosts();

/* ---------- browser preview mock (fictional data; only used outside Tauri) ---------- */
// Open index.html#demo to auto-open a session with sample output (used for the README screenshot).
if (!T && location.hash === "#demo") setTimeout(() => openSessionFor(hosts[0]), 300);

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
    case "save_host": { const x = { ...args.input, id: args.input.id || String(Date.now()), hasSecret: false }; const i = db.findIndex((d) => d.id === x.id); i >= 0 ? (db[i] = x) : db.push(x); return Promise.resolve(x); }
    case "connect": setTimeout(() => { args.onEvent.onmessage({ type: "status", state: "connected", message: "" }); args.onEvent.onmessage({ type: "data", data: demo }); }, 400); return Promise.resolve();
    default: return Promise.resolve(cmd === "clip_read" ? "" : null);
  }
}
