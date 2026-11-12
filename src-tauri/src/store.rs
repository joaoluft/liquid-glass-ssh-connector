use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct HostEntry {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub user: String,
    /// "password" | "key"
    pub auth: String,
    pub key_path: String,
    pub color: String,
    /// Custom avatar as a `data:image/...` URL (already resized by the UI); empty = initials.
    #[serde(skip_serializing_if = "String::is_empty")]
    pub icon: String,
    /// DPAPI-protected secret (password or key passphrase), base64-less hex.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub secret: Option<String>,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct AppData {
    pub hosts: Vec<HostEntry>,
    /// "host:port" -> "ssh-ed25519 SHA256:..."
    pub known_hosts: HashMap<String, String>,
}

pub struct Store {
    pub data: Mutex<AppData>,
    path: PathBuf,
}

impl Store {
    pub fn load() -> Self {
        let appdata = PathBuf::from(std::env::var("APPDATA").unwrap_or_else(|_| ".".into()));
        let dir = appdata.join("SSHConnector");
        // migrate config from the app's previous name
        let legacy = appdata.join("HomelabSSH");
        if !dir.exists() && legacy.exists() {
            let _ = std::fs::rename(&legacy, &dir);
        }
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("config.json");
        let data = match std::fs::read_to_string(&path) {
            Ok(s) => serde_json::from_str(&s).unwrap_or_else(|_| {
                let _ = std::fs::copy(&path, dir.join("config.json.bak"));
                AppData::default()
            }),
            // first run: start with an empty list; the UI invites the user to add a machine
            Err(_) => AppData::default(),
        };
        let s = Store { data: Mutex::new(data), path };
        s.save();
        s
    }

    pub fn save(&self) {
        let d = self.data.lock().unwrap();
        if let Ok(json) = serde_json::to_string_pretty(&*d) {
            let tmp = self.path.with_extension("tmp");
            if std::fs::write(&tmp, json).is_ok() {
                let _ = std::fs::rename(&tmp, &self.path);
            }
        }
    }

    pub fn find(&self, id: &str) -> Option<HostEntry> {
        self.data.lock().unwrap().hosts.iter().find(|h| h.id == id).cloned()
    }

    pub fn update<F: FnOnce(&mut HostEntry)>(&self, id: &str, f: F) {
        {
            let mut d = self.data.lock().unwrap();
            if let Some(h) = d.hosts.iter_mut().find(|h| h.id == id) {
                f(h);
            }
        }
        self.save();
    }
}

// ---- DPAPI (CurrentUser) ----
use windows_sys::Win32::Foundation::LocalFree;
use windows_sys::Win32::Security::Cryptography::{CryptProtectData, CryptUnprotectData, CRYPT_INTEGER_BLOB};

fn hex(b: &[u8]) -> String {
    b.iter().map(|x| format!("{:02x}", x)).collect()
}
fn unhex(s: &str) -> Option<Vec<u8>> {
    if s.len() % 2 != 0 {
        return None;
    }
    (0..s.len()).step_by(2).map(|i| u8::from_str_radix(&s[i..i + 2], 16).ok()).collect()
}

pub fn protect(plain: &str) -> Option<String> {
    unsafe {
        let mut input = plain.as_bytes().to_vec();
        let inb = CRYPT_INTEGER_BLOB { cbData: input.len() as u32, pbData: input.as_mut_ptr() };
        let mut out = CRYPT_INTEGER_BLOB { cbData: 0, pbData: std::ptr::null_mut() };
        if CryptProtectData(&inb, std::ptr::null(), std::ptr::null(), std::ptr::null(), std::ptr::null(), 0, &mut out) == 0 {
            return None;
        }
        let v = std::slice::from_raw_parts(out.pbData, out.cbData as usize).to_vec();
        LocalFree(out.pbData as _);
        Some(hex(&v))
    }
}

pub fn unprotect(enc: &str) -> Option<String> {
    let mut input = unhex(enc)?;
    unsafe {
        let inb = CRYPT_INTEGER_BLOB { cbData: input.len() as u32, pbData: input.as_mut_ptr() };
        let mut out = CRYPT_INTEGER_BLOB { cbData: 0, pbData: std::ptr::null_mut() };
        if CryptUnprotectData(&inb, std::ptr::null_mut(), std::ptr::null(), std::ptr::null(), std::ptr::null(), 0, &mut out) == 0 {
            return None;
        }
        let v = std::slice::from_raw_parts(out.pbData, out.cbData as usize).to_vec();
        LocalFree(out.pbData as _);
        String::from_utf8(v).ok()
    }
}
