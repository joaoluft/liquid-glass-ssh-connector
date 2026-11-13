use crate::store::{self, HostEntry};
use crate::STORE;
use russh::client::{self, Handle};
use russh::keys::{load_secret_key, ssh_key, HashAlg, PrivateKeyWithHashAlg};
use russh::ChannelMsg;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::ipc::Channel;
use tokio::sync::{mpsc, oneshot};

/// Low-rate control events (JSON over a Tauri Channel). Terminal output does NOT go through here:
/// every Channel message is a script evaluation in the webview, and pushing output that way made
/// long heavy sessions pile up CPU and memory. Output is pulled instead, see [`OutBuf`] / [`read`].
#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Ev {
    Status { state: &'static str, message: String },
    NeedSecret { kind: &'static str, reason: String },
    HostKey { host: String, fingerprint: String, changed: bool },
}

/// Raw terminal output waiting for the webview. The UI long-polls [`read`], which returns everything
/// accumulated so far as raw bytes over the IPC protocol (no script eval). If the UI falls behind and
/// the buffer reaches [`MAX_BUFFERED`], the session stops reading the SSH channel, so SSH flow control
/// pushes back on the server instead of memory growing without bound.
#[derive(Default)]
pub struct OutBuf {
    buf: Mutex<Vec<u8>>,
    ready: tokio::sync::Notify,
    drained: tokio::sync::Notify,
    closed: std::sync::atomic::AtomicBool,
}

const MAX_BUFFERED: usize = 4 * 1024 * 1024;

impl OutBuf {
    fn push(&self, data: &[u8]) {
        self.buf.lock().unwrap().extend_from_slice(data);
        self.ready.notify_one();
    }
    fn len(&self) -> usize {
        self.buf.lock().unwrap().len()
    }
    fn close(&self) {
        self.closed.store(true, std::sync::atomic::Ordering::SeqCst);
        self.ready.notify_one();
    }
}

/// Long-poll for output: resolves as soon as there is data (or after a timeout with an empty body).
/// Errors once the session is gone and everything has been delivered.
pub async fn read(sid: &str) -> Result<Vec<u8>, String> {
    let out = SESSIONS.lock().unwrap().get(sid).map(|s| s.out.clone()).ok_or("closed")?;
    loop {
        let taken = std::mem::take(&mut *out.buf.lock().unwrap());
        if !taken.is_empty() {
            out.drained.notify_one();
            return Ok(taken);
        }
        if out.closed.load(std::sync::atomic::Ordering::SeqCst) {
            return Err("closed".into());
        }
        // notify_one() stores a permit when nobody waits, so data arriving between the take()
        // above and this await is never missed.
        if tokio::time::timeout(Duration::from_secs(15), out.ready.notified()).await.is_err() {
            return Ok(Vec::new());
        }
    }
}

pub enum Cmd {
    Data(Vec<u8>),
    Resize(u32, u32),
    Close,
}

type HkSlot = Arc<Mutex<Option<oneshot::Sender<bool>>>>;

pub struct Sess {
    pub tx: mpsc::UnboundedSender<Cmd>,
    pub hk: HkSlot,
    pub handle: Option<Arc<Handle<Client>>>,
    pub host_id: String,
    pub out: Arc<OutBuf>,
}

pub static SESSIONS: std::sync::LazyLock<Mutex<HashMap<String, Sess>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

pub struct Client {
    key: String,
    ev: Channel<Ev>,
    hk: HkSlot,
}

impl client::Handler for Client {
    type Error = russh::Error;

    async fn check_server_key(&mut self, key: &ssh_key::PublicKey) -> Result<bool, Self::Error> {
        let fp = format!("{} {}", key.algorithm().as_str(), key.fingerprint(HashAlg::Sha256));
        let known = STORE.get().unwrap().data.lock().unwrap().known_hosts.get(&self.key).cloned();
        if known.as_deref() == Some(fp.as_str()) {
            return Ok(true);
        }
        let (tx, rx) = oneshot::channel();
        *self.hk.lock().unwrap() = Some(tx);
        let _ = self.ev.send(Ev::HostKey { host: self.key.clone(), fingerprint: fp.clone(), changed: known.is_some() });
        let ok = matches!(tokio::time::timeout(Duration::from_secs(300), rx).await, Ok(Ok(true)));
        if ok {
            let s = STORE.get().unwrap();
            s.data.lock().unwrap().known_hosts.insert(self.key.clone(), fp);
            s.save();
        }
        Ok(ok)
    }
}

fn status(ev: &Channel<Ev>, state: &'static str, msg: impl Into<String>) {
    let _ = ev.send(Ev::Status { state, message: msg.into() });
}

fn expand(p: &str) -> String {
    let home = std::env::var("USERPROFILE").unwrap_or_default();
    if p.trim().is_empty() {
        return format!("{home}\\.ssh\\id_ed25519");
    }
    if let Some(rest) = p.strip_prefix('~') {
        return format!("{home}{rest}");
    }
    p.to_string()
}


fn friendly(e: &russh::Error) -> String {
    match e {
        russh::Error::UnknownKey => "Chave do host rejeitada.".into(),
        russh::Error::ConnectionTimeout => "Tempo esgotado.".into(),
        russh::Error::IO(io) => match io.kind() {
            std::io::ErrorKind::ConnectionRefused => "Conexão recusada — o SSH está rodando nessa porta?".into(),
            std::io::ErrorKind::TimedOut => "Tempo esgotado — host inacessível.".into(),
            _ => io.to_string(),
        },
        other => other.to_string(),
    }
}

pub async fn run(sid: String, host: HostEntry, secret_override: Option<String>, remember: bool, cols: u32, rows: u32, prompt: Option<HashMap<String, String>>, ev: Channel<Ev>) {
    let secret = secret_override.clone().or_else(|| host.secret.as_deref().and_then(store::unprotect));

    if host.auth == "password" && secret.as_deref().unwrap_or("").is_empty() {
        let _ = ev.send(Ev::NeedSecret { kind: "password", reason: String::new() });
        return;
    }

    // Load key up-front so we can ask for a passphrase before connecting.
    let key = if host.auth == "key" {
        let path = expand(&host.key_path);
        if !std::path::Path::new(&path).exists() {
            status(&ev, "error", format!("Chave privada não encontrada: {path}"));
            return;
        }
        match load_secret_key(&path, secret.as_deref().filter(|s| !s.is_empty())) {
            Ok(k) => Some(k),
            Err(russh::keys::Error::KeyIsEncrypted) => {
                let _ = ev.send(Ev::NeedSecret { kind: "passphrase", reason: "A chave está protegida por senha.".into() });
                return;
            }
            Err(e) => {
                if secret.is_some() {
                    let _ = ev.send(Ev::NeedSecret { kind: "passphrase", reason: "Senha da chave incorreta.".into() });
                } else {
                    status(&ev, "error", format!("Não foi possível ler a chave: {e}"));
                }
                return;
            }
        }
    } else {
        None
    };

    status(&ev, "connecting", format!("Conectando a {}@{}:{}…", host.user, host.host, host.port));

    let (tx, mut rx) = mpsc::unbounded_channel::<Cmd>();
    let hk: HkSlot = Arc::new(Mutex::new(None));
    let out = Arc::new(OutBuf::default());
    SESSIONS.lock().unwrap().insert(sid.clone(), Sess { tx, hk: hk.clone(), handle: None, host_id: host.id.clone(), out: out.clone() });

    let cfg = Arc::new(client::Config {
        keepalive_interval: Some(Duration::from_secs(30)),
        inactivity_timeout: None,
        ..Default::default()
    });
    let handler = Client { key: format!("{}:{}", host.host, host.port), ev: ev.clone(), hk };

    let connect = client::connect(cfg, (host.host.as_str(), host.port), handler);
    let mut h = match tokio::time::timeout(Duration::from_secs(12), connect).await {
        Err(_) => return fail(&sid, &ev, "Tempo esgotado — host inacessível."),
        Ok(Err(e)) => return fail(&sid, &ev, &friendly(&e)),
        Ok(Ok(h)) => h,
    };

    let authed = match authenticate(&mut h, &host, key, secret.as_deref()).await {
        Ok(ok) => ok,
        Err(e) => return fail(&sid, &ev, &friendly(&e)),
    };
    if !authed {
        SESSIONS.lock().unwrap().remove(&sid);
        let kind = if host.auth == "key" { "passphrase" } else { "password" };
        let reason = if host.auth == "key" { "O servidor recusou a chave." } else { "Senha incorreta. Tente novamente." };
        let _ = ev.send(Ev::NeedSecret { kind, reason: reason.into() });
        return;
    }

    if remember {
        if let Some(s) = secret_override.as_deref().filter(|s| !s.is_empty()) {
            let enc = store::protect(s);
            STORE.get().unwrap().update(&host.id, |hh| hh.secret = enc);
        }
    }

    let h = Arc::new(h);
    if let Some(s) = SESSIONS.lock().unwrap().get_mut(&sid) {
        s.handle = Some(h.clone());
    }

    let mut channel = match async {
        let ch = h.channel_open_session().await?;
        ch.request_pty(false, "xterm-256color", cols.max(20), rows.max(5), 0, 0, &[]).await?;
        match &prompt {
            Some(cfg) => ch.exec(false, prompt_command(cfg)).await?,
            None => ch.request_shell(false).await?,
        }
        Ok::<_, russh::Error>(ch)
    }
    .await
    {
        Ok(c) => c,
        Err(e) => return fail(&sid, &ev, &friendly(&e)),
    };

    status(&ev, "connected", format!("{}@{}", host.user, host.host));

    let reason = loop {
        // Backpressure: while the UI hasn't picked up MAX_BUFFERED bytes, stop reading the SSH channel.
        let full = out.len() >= MAX_BUFFERED;
        tokio::select! {
            cmd = rx.recv() => match cmd {
                Some(Cmd::Data(b)) => { if let Err(e) = channel.data(&b[..]).await { break friendly(&e); } }
                Some(Cmd::Resize(c, r)) => { let _ = channel.window_change(c.max(20), r.max(5), 0, 0).await; }
                Some(Cmd::Close) | None => { let _ = channel.close().await; break "Desconectado.".to_string(); }
            },
            msg = channel.wait(), if !full => match msg {
                Some(ChannelMsg::Data { data }) | Some(ChannelMsg::ExtendedData { data, .. }) => out.push(&data),
                Some(ChannelMsg::Eof) | Some(ChannelMsg::Close) | None => break "Sessão encerrada.".to_string(),
                _ => {}
            },
            _ = out.drained.notified(), if full => {}
        }
    };

    // let the UI pick up the last output before the session disappears
    out.close();
    for _ in 0..50 {
        if out.len() == 0 {
            break;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    SESSIONS.lock().unwrap().remove(&sid);
    let _ = h.disconnect(russh::Disconnect::ByApplication, "", "pt-BR").await;
    status(&ev, "closed", reason);
}

fn fail(sid: &str, ev: &Channel<Ev>, msg: &str) {
    SESSIONS.lock().unwrap().remove(sid);
    status(ev, "error", msg);
}

async fn authenticate(
    h: &mut Handle<Client>,
    host: &HostEntry,
    key: Option<ssh_key::PrivateKey>,
    secret: Option<&str>,
) -> Result<bool, russh::Error> {
    if let Some(k) = key {
        let hash = h.best_supported_rsa_hash().await?.flatten();
        let r = h.authenticate_publickey(&host.user, PrivateKeyWithHashAlg::new(Arc::new(k), hash)).await?;
        return Ok(r.success());
    }
    let pw = secret.unwrap_or("");
    if h.authenticate_password(&host.user, pw).await?.success() {
        return Ok(true);
    }
    // Fallback: keyboard-interactive answering every prompt with the password.
    use russh::client::KeyboardInteractiveAuthResponse as K;
    let mut resp = h.authenticate_keyboard_interactive_start(&host.user, None::<String>).await?;
    for _ in 0..4 {
        match resp {
            K::Success => return Ok(true),
            K::Failure { .. } => return Ok(false),
            K::InfoRequest { prompts, .. } => {
                let answers = prompts.iter().map(|_| pw.to_string()).collect();
                resp = h.authenticate_keyboard_interactive_respond(answers).await?;
            }
        }
    }
    Ok(false)
}

/// Generates ~/.ssh/id_ed25519 if missing, installs it on the server through the live session,
/// and switches the host to key auth.
pub async fn install_key(sid: &str) -> Result<String, String> {
    let (handle, host_id) = {
        let m = SESSIONS.lock().unwrap();
        let s = m.get(sid).ok_or("Sessão não encontrada.")?;
        (s.handle.clone().ok_or("Conecte-se primeiro.")?, s.host_id.clone())
    };

    let home = std::env::var("USERPROFILE").map_err(|e| e.to_string())?;
    let key_path = format!("{home}\\.ssh\\id_ed25519");
    if !std::path::Path::new(&key_path).exists() {
        let _ = std::fs::create_dir_all(format!("{home}\\.ssh"));
        let sysroot = std::env::var("SystemRoot").unwrap_or("C:\\Windows".into());
        let mut keygen = format!("{sysroot}\\System32\\OpenSSH\\ssh-keygen.exe");
        if !std::path::Path::new(&keygen).exists() {
            keygen = "ssh-keygen".into();
        }
        use std::os::windows::process::CommandExt;
        let out = std::process::Command::new(keygen)
            .args(["-q", "-t", "ed25519", "-N", "", "-C", "ssh-connector", "-f", &key_path])
            .creation_flags(0x0800_0000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("Falha ao executar ssh-keygen: {e}"))?;
        if !out.status.success() {
            return Err(format!("ssh-keygen falhou: {}", String::from_utf8_lossy(&out.stderr)));
        }
    }
    load_secret_key(&key_path, None).map_err(|_| "A chave ~/.ssh/id_ed25519 existe mas tem senha; não dá para usá-la automaticamente.".to_string())?;

    let pubtxt = std::fs::read_to_string(format!("{key_path}.pub")).map_err(|e| e.to_string())?;
    let parts: Vec<&str> = pubtxt.split_whitespace().collect();
    if parts.len() < 2
        || !parts[0].chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '@' || c == '.')
        || !parts[1].chars().all(|c| c.is_ascii_alphanumeric() || c == '+' || c == '/' || c == '=')
    {
        return Err("Chave pública inválida.".into());
    }
    let (kt, kd) = (parts[0], parts[1]);
    let cmd = format!(
        "umask 077; mkdir -p ~/.ssh && touch ~/.ssh/authorized_keys && \
         (grep -qF '{kd}' ~/.ssh/authorized_keys || echo '{kt} {kd} ssh-connector' >> ~/.ssh/authorized_keys) && \
         chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys; \
         command -v restorecon >/dev/null 2>&1 && restorecon -R ~/.ssh; echo HOMELAB_OK"
    );

    let mut ch = handle.channel_open_session().await.map_err(|e| e.to_string())?;
    ch.exec(true, cmd).await.map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    while let Some(msg) = ch.wait().await {
        match msg {
            ChannelMsg::Data { data } => out.extend_from_slice(&data),
            ChannelMsg::Eof | ChannelMsg::Close => break,
            _ => {}
        }
    }
    if !String::from_utf8_lossy(&out).contains("HOMELAB_OK") {
        return Err("O servidor não confirmou a instalação da chave.".into());
    }

    STORE.get().unwrap().update(&host_id, |h| {
        h.auth = "key".into();
        h.key_path = key_path.clone();
        h.secret = None;
    });
    Ok(key_path)
}

/// Shell history from the server (bash, zsh or fish), most recent first, for command suggestions.
/// Read through a separate exec channel; nothing is stored on disk by the app.
pub async fn fetch_history(sid: &str) -> Result<Vec<String>, String> {
    let handle = {
        let m = SESSIONS.lock().unwrap();
        let s = m.get(sid).ok_or("Sessão não encontrada.")?;
        s.handle.clone().ok_or("Conecte-se primeiro.")?
    };
    // fixed command, no user input involved
    const CMD: &str = "cat ~/.bash_history ~/.zsh_history ~/.local/share/fish/fish_history 2>/dev/null | tail -n 5000";
    const MAX: usize = 1024 * 1024;

    let run = async {
        let mut ch = handle.channel_open_session().await.map_err(|e| e.to_string())?;
        ch.exec(true, CMD).await.map_err(|e| e.to_string())?;
        let mut out = Vec::new();
        while let Some(msg) = ch.wait().await {
            match msg {
                ChannelMsg::Data { data } => {
                    out.extend_from_slice(&data);
                    if out.len() > MAX {
                        break;
                    }
                }
                ChannelMsg::Eof | ChannelMsg::Close => break,
                _ => {}
            }
        }
        Ok::<_, String>(out)
    };
    let raw = tokio::time::timeout(Duration::from_secs(5), run)
        .await
        .map_err(|_| "Tempo esgotado lendo o histórico.".to_string())??;

    let text = String::from_utf8_lossy(&raw);
    let mut seen = std::collections::HashSet::new();
    let mut cmds: Vec<String> = Vec::new();
    for line in text.lines().rev() {
        let mut c = line.trim();
        if c.is_empty() || c.starts_with('#') || c.starts_with("when:") {
            continue; // bash timestamps, fish metadata
        }
        // zsh extended history ": 1699999999:0;cmd"
        if c.starts_with(": ") {
            if let Some(i) = c.find(';') {
                c = &c[i + 1..];
            }
        }
        // fish "- cmd: cmd"
        if let Some(rest) = c.strip_prefix("- cmd: ") {
            c = rest;
        }
        let c = c.trim();
        if c.len() < 2 || c.len() > 500 {
            continue;
        }
        if seen.insert(c.to_string()) {
            cmds.push(c.to_string());
            if cmds.len() >= 2000 {
                break;
            }
        }
    }
    Ok(cmds)
}


/// The session-only prompt (see prompt.bash), started in place of the plain login shell.
const PROMPT_RC: &str = include_str!("prompt.bash");
const PROMPT_KEYS: &[&str] = &[
    "style", "two", "dirmode", "segs", "c_user_bg", "c_user_fg", "c_dir_bg", "c_dir_fg", "c_git_bg", "c_git_fg",
    "c_gitd_bg", "c_gitd_fg", "c_dur_bg", "c_dur_fg", "c_err_bg", "c_err_fg", "c_time_bg", "c_time_fg", "c_ok", "c_bad",
];

/// Remote command: if the login shell is bash, write the prompt rc to a temp file (it deletes itself
/// on load) and start `bash --rcfile` with it; any other shell (zsh, fish…) just starts as usual.
/// App options become `__sshc_*` assignments, accepted only for known keys and a tiny charset.
fn prompt_command(cfg: &HashMap<String, String>) -> String {
    let quoted = prompt_rc(cfg).replace('\'', r"'\''");
    format!(
        "case \"${{SHELL##*/}}\" in bash) ;; *) exec \"${{SHELL:-/bin/sh}}\" -l ;; esac; \
         command -v bash >/dev/null 2>&1 || exec \"${{SHELL:-/bin/sh}}\" -l; \
         f=$(mktemp 2>/dev/null || echo \"/tmp/.sshc_rc_$$\"); \
         printf '%s\n' '{quoted}' > \"$f\" && SSHC_RC=\"$f\" exec bash --rcfile \"$f\" -i; \
         exec \"${{SHELL:-/bin/sh}}\" -l"
    )
}

/// The rc file: validated `__sshc_*` assignments followed by prompt.bash (LF line endings only).
fn prompt_rc(cfg: &HashMap<String, String>) -> String {
    let mut rc = String::new();
    for k in PROMPT_KEYS {
        if let Some(v) = cfg.get(*k) {
            if v.len() <= 80 && v.chars().all(|c| c.is_ascii_alphanumeric() || " ;_-".contains(c)) {
                rc.push_str(&format!("__sshc_{k}='{v}'\n"));
            }
        }
    }
    rc.push_str(&PROMPT_RC.replace('\r', ""));
    rc
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Writes the remote command for a sample config, so it can be run against a real bash.
    #[test]
    fn prompt_command_is_built_and_sanitized() {
        let mut cfg = HashMap::new();
        cfg.insert("style".to_string(), "round".to_string());
        cfg.insert("two".to_string(), "0".to_string());
        cfg.insert("c_dir_bg".to_string(), "10;20;30".to_string());
        cfg.insert("segs".to_string(), "dir git".to_string());
        cfg.insert("evil".to_string(), "x".to_string()); // unknown key: dropped
        cfg.insert("c_user_bg".to_string(), "1'; rm -rf ~; '".to_string()); // bad chars: dropped
        let rc = prompt_rc(&cfg);
        assert!(rc.contains("__sshc_style='round'"));
        assert!(rc.contains("__sshc_c_dir_bg='10;20;30'"));
        assert!(rc.contains("__sshc_segs='dir git'"));
        assert!(!rc.contains("__sshc_evil"));
        assert!(!rc.contains("rm -rf"));
        assert!(!rc.contains('\r'));
        let cmd = prompt_command(&cfg);
        if let Ok(path) = std::env::var("SSHC_DUMP_CMD") {
            std::fs::write(path, &cmd).unwrap();
        }
    }
}
