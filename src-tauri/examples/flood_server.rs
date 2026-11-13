//! Local SSH server for stress-testing the client: accepts any password and, once a shell is
//! requested, streams a TUI-like full-screen redraw (~30 fps), one line per SSH data packet —
//! the many-small-chunks pattern of spinners, agents, htop, `docker logs -f`, etc.
//!
//!   cargo run --release --example flood_server -- <host_key_file> [port] [fps]
//! Generate a key first: ssh-keygen -t ed25519 -N "" -f flood_key
use russh::keys::load_secret_key;
use russh::server::{self, Auth, Msg, Server as _, Session};
use russh::{Channel, ChannelId, CryptoVec};
use std::sync::Arc;
use std::time::Duration;

#[derive(Clone)]
struct Flood {
    fps: u64,
}

impl server::Server for Flood {
    type Handler = Flood;
    fn new_client(&mut self, _: Option<std::net::SocketAddr>) -> Flood {
        self.clone()
    }
}

impl server::Handler for Flood {
    type Error = russh::Error;

    async fn auth_password(&mut self, _user: &str, _pw: &str) -> Result<Auth, Self::Error> {
        Ok(Auth::Accept)
    }

    async fn channel_open_session(&mut self, _ch: Channel<Msg>, _s: &mut Session) -> Result<bool, Self::Error> {
        Ok(true)
    }

    async fn pty_request(
        &mut self,
        ch: ChannelId,
        _term: &str,
        _c: u32,
        _r: u32,
        _pw: u32,
        _ph: u32,
        _modes: &[(russh::Pty, u32)],
        s: &mut Session,
    ) -> Result<(), Self::Error> {
        s.channel_success(ch)?;
        Ok(())
    }

    /// Echo keystrokes back (Enter -> newline), so typing can be verified end to end.
    async fn data(&mut self, ch: ChannelId, data: &[u8], s: &mut Session) -> Result<(), Self::Error> {
        let echo: Vec<u8> = data.iter().flat_map(|&b| if b == b'\r' { vec![b'\r', b'\n'] } else { vec![b] }).collect();
        s.data(ch, CryptoVec::from(echo))?;
        Ok(())
    }

    async fn shell_request(&mut self, ch: ChannelId, s: &mut Session) -> Result<(), Self::Error> {
        s.channel_success(ch)?;
        if self.fps == 0 {
            // echo-only mode: just a prompt
            s.data(ch, CryptoVec::from("echo-mode$ ".to_string()))?;
            return Ok(());
        }
        let h = s.handle();
        let frame = Duration::from_millis(1000 / self.fps.max(1));
        tokio::spawn(async move {
            let spin = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            let mut tick: u64 = 0;
            loop {
                tick += 1;
                if h.data(ch, CryptoVec::from("\x1b[H".to_string())).await.is_err() {
                    return;
                }
                for r in 0..28u64 {
                    let pct = (tick * 3 + r * 7) % 100;
                    let bar = (pct / 4) as usize;
                    let line = format!(
                        "\x1b[2K\x1b[38;5;{}m{} worker-{:02}\x1b[0m [\x1b[32m{}\x1b[90m{}\x1b[0m] {:>3}%  \x1b[2mreq={} lat={}ms\x1b[0m\r\n",
                        (r * 7 + tick) % 230 + 17,
                        spin[((tick + r) % 10) as usize],
                        r,
                        "█".repeat(bar),
                        "░".repeat(25 - bar),
                        pct,
                        (tick * 13 + r * 101) % 99999,
                        (tick + r) % 250
                    );
                    if h.data(ch, CryptoVec::from(line)).await.is_err() {
                        return;
                    }
                }
                tokio::time::sleep(frame).await;
            }
        });
        Ok(())
    }
}

#[tokio::main]
async fn main() {
    let mut a = std::env::args().skip(1);
    let key_path = a.next().expect("usage: flood_server <host_key_file> [port] [fps]");
    let port: u16 = a.next().map(|p| p.parse().unwrap()).unwrap_or(2222);
    let fps: u64 = a.next().map(|p| p.parse().unwrap()).unwrap_or(30);
    let key = load_secret_key(&key_path, None).expect("host key");
    let cfg = server::Config {
        keys: vec![key],
        inactivity_timeout: None,
        ..Default::default()
    };
    println!("flood server on 127.0.0.1:{port} at {fps} fps");
    Flood { fps }.run_on_address(Arc::new(cfg), ("127.0.0.1", port)).await.unwrap();
}
