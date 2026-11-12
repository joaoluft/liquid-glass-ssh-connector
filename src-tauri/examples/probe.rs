// Smoke test: handshake with a server, print host key, try a bogus password (expects rejection).
use russh::client;
use russh::keys::{ssh_key, HashAlg};
use std::sync::Arc;
struct H;
impl client::Handler for H {
    type Error = russh::Error;
    async fn check_server_key(&mut self, k: &ssh_key::PublicKey) -> Result<bool, Self::Error> {
        println!("host key: {} {}", k.algorithm().as_str(), k.fingerprint(HashAlg::Sha256));
        Ok(true)
    }
}
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let host = std::env::args().nth(1).expect("uso: cargo run --example probe -- <host>");
    let mut h = client::connect(Arc::new(client::Config::default()), (host.as_str(), 22), H).await.expect("connect");
    let r = h.authenticate_password("homelab-probe", "wrong").await.expect("auth call");
    println!("bogus password accepted? {}", r.success());
}
