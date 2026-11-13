#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ssh;
mod store;

use serde::{Deserialize, Serialize};
use ssh::{Cmd, Ev, SESSIONS};
use std::sync::OnceLock;
use std::time::{Duration, Instant};
use store::{HostEntry, Store};
use tauri::ipc::Channel;

pub static STORE: OnceLock<Store> = OnceLock::new();

fn store() -> &'static Store {
    STORE.get().unwrap()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HostView {
    id: String,
    name: String,
    host: String,
    port: u16,
    user: String,
    auth: String,
    key_path: String,
    color: String,
    icon: String,
    has_secret: bool,
}

impl From<&HostEntry> for HostView {
    fn from(h: &HostEntry) -> Self {
        HostView {
            id: h.id.clone(),
            name: h.name.clone(),
            host: h.host.clone(),
            port: h.port,
            user: h.user.clone(),
            auth: h.auth.clone(),
            key_path: h.key_path.clone(),
            color: h.color.clone(),
            icon: h.icon.clone(),
            has_secret: h.secret.is_some(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct HostInput {
    id: Option<String>,
    name: String,
    host: String,
    port: u16,
    user: String,
    auth: String,
    key_path: String,
    color: String,
    /// New secret to store; None keeps the current one.
    secret: Option<String>,
    #[serde(default)]
    clear_secret: bool,
}

#[tauri::command]
fn list_hosts() -> Vec<HostView> {
    store().data.lock().unwrap().hosts.iter().map(HostView::from).collect()
}

#[tauri::command]
fn save_host(input: HostInput) -> Result<HostView, String> {
    if input.host.trim().is_empty() {
        return Err("Informe o endereço do host.".into());
    }
    let s = store();
    let view = {
        let mut d = s.data.lock().unwrap();
        let id = input.id.clone().filter(|i| !i.is_empty()).unwrap_or_else(|| uuid::Uuid::new_v4().simple().to_string());
        let idx = d.hosts.iter().position(|h| h.id == id);
        let mut h = idx.map(|i| d.hosts[i].clone()).unwrap_or_default();
        h.id = id;
        h.name = if input.name.trim().is_empty() { input.host.trim().to_string() } else { input.name.trim().to_string() };
        h.host = input.host.trim().to_string();
        h.port = if input.port == 0 { 22 } else { input.port };
        h.user = input.user.trim().to_string();
        h.auth = if input.auth == "key" { "key".into() } else { "password".into() };
        h.key_path = input.key_path.trim().to_string();
        h.color = input.color;
        if input.clear_secret {
            h.secret = None;
        }
        if let Some(sec) = input.secret.filter(|x| !x.is_empty()) {
            h.secret = store::protect(&sec);
        }
        let v = HostView::from(&h);
        match idx {
            Some(i) => d.hosts[i] = h,
            None => d.hosts.push(h),
        }
        v
    };
    s.save();
    Ok(view)
}

#[tauri::command]
fn delete_host(id: String) {
    let s = store();
    s.data.lock().unwrap().hosts.retain(|h| h.id != id);
    s.save();
}

/// Sets (or with an empty string, removes) a host's custom avatar image.
#[tauri::command]
fn set_host_icon(id: String, icon: String) -> Result<(), String> {
    const MAX: usize = 512 * 1024;
    if !icon.is_empty() && !icon.starts_with("data:image/") {
        return Err("Formato de imagem inválido.".into());
    }
    if icon.len() > MAX {
        return Err("Imagem grande demais.".into());
    }
    let s = store();
    if s.find(&id).is_none() {
        return Err("Máquina não encontrada.".into());
    }
    s.update(&id, |h| h.icon = icon);
    Ok(())
}

#[tauri::command]
fn reorder_hosts(ids: Vec<String>) {
    let s = store();
    {
        let mut d = s.data.lock().unwrap();
        d.hosts.sort_by_key(|h| ids.iter().position(|i| *i == h.id).unwrap_or(usize::MAX));
    }
    s.save();
}

/// TCP reachability probe; returns latency in ms.
#[tauri::command]
async fn probe(host: String, port: u16) -> Option<u32> {
    let start = Instant::now();
    match tokio::time::timeout(Duration::from_millis(1500), tokio::net::TcpStream::connect((host.as_str(), port))).await {
        Ok(Ok(_)) => Some(start.elapsed().as_millis() as u32),
        _ => None,
    }
}

#[tauri::command]
fn connect(session_id: String, host_id: String, secret: Option<String>, remember: bool, cols: u32, rows: u32, on_event: Channel<Ev>) -> Result<(), String> {
    let host = store().find(&host_id).ok_or("Máquina não encontrada.")?;
    if host.user.is_empty() {
        return Err("Defina o usuário desta máquina.".into());
    }
    tauri::async_runtime::spawn(ssh::run(session_id, host, secret, remember, cols, rows, on_event));
    Ok(())
}

#[tauri::command]
// async = runs on the worker pool, not the window's main thread (keystrokes never wait behind rendering)
async fn write(session_id: String, data: String) {
    if let Some(s) = SESSIONS.lock().unwrap().get(&session_id) {
        let _ = s.tx.send(Cmd::Data(data.into_bytes()));
    }
}

#[tauri::command]
async fn resize(session_id: String, cols: u32, rows: u32) {
    if let Some(s) = SESSIONS.lock().unwrap().get(&session_id) {
        let _ = s.tx.send(Cmd::Resize(cols, rows));
    }
}

#[tauri::command]
fn answer_host_key(session_id: String, accept: bool) {
    if let Some(s) = SESSIONS.lock().unwrap().get(&session_id) {
        if let Some(tx) = s.hk.lock().unwrap().take() {
            let _ = tx.send(accept);
        }
    }
}

#[tauri::command]
fn disconnect(session_id: String) {
    if let Some(s) = SESSIONS.lock().unwrap().get(&session_id) {
        if let Some(tx) = s.hk.lock().unwrap().take() {
            let _ = tx.send(false);
        }
        let _ = s.tx.send(Cmd::Close);
    }
}

#[tauri::command]
async fn install_key(session_id: String) -> Result<String, String> {
    ssh::install_key(&session_id).await
}

/// Long-poll for terminal output, returned as raw bytes (ArrayBuffer in JS) over the IPC protocol.
#[tauri::command]
async fn read(session_id: String) -> Result<tauri::ipc::Response, String> {
    ssh::read(&session_id).await.map(tauri::ipc::Response::new)
}

/// `SSH Connector.exe --connect <name|id>` opens that machine on startup (handy for desktop shortcuts).
#[tauri::command]
fn startup_connect() -> Option<String> {
    let args: Vec<String> = std::env::args().collect();
    args.iter().position(|a| a == "--connect").and_then(|i| args.get(i + 1).cloned())
}

#[tauri::command]
fn clip_read() -> String {
    arboard::Clipboard::new().and_then(|mut c| c.get_text()).unwrap_or_default()
}

#[tauri::command]
fn clip_write(text: String) {
    if let Ok(mut c) = arboard::Clipboard::new() {
        let _ = c.set_text(text);
    }
}

fn main() {
    let _ = STORE.set(Store::load());
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_hosts,
            save_host,
            delete_host,
            set_host_icon,
            reorder_hosts,
            probe,
            connect,
            write,
            resize,
            answer_host_key,
            disconnect,
            install_key,
            read,
            startup_connect,
            clip_read,
            clip_write
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o SSH Connector");
}
