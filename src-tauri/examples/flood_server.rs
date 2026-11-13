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
    /// stdin of a real bash started for the app's prompt command (see exec_request)
    shells: Arc<tokio::sync::Mutex<std::collections::HashMap<ChannelId, tokio::process::ChildStdin>>>,
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

    /// `exec` requests (the app reads shell history this way): answer with a fake history.
    async fn exec_request(&mut self, ch: ChannelId, cmd: &[u8], s: &mut Session) -> Result<(), Self::Error> {
        s.channel_success(ch)?;
        let cmd = String::from_utf8_lossy(cmd).to_string();
        // The app's modern-prompt command: run it in a real bash (Git for Windows) so the whole path
        // (remote command, prompt.bash, colors, OSC reports) can be checked end to end.
        // HOME comes from FLOOD_HOME. No tty here, so we echo input ourselves and fix line endings.
        if cmd.contains("SSHC_RC") {
            use tokio::io::AsyncReadExt;
            let bash = std::env::var("FLOOD_BASH").unwrap_or_else(|_| r"C:\Program Files\Git\bin\bash.exe".into());
            // hand the command over in a file: Windows argv quoting (MSYS treats ' specially) would mangle
            // it, while a real sshd passes it verbatim to `$SHELL -c`
            let script = std::env::temp_dir().join(format!("flood_cmd_{}.sh", std::process::id()));
            std::fs::write(&script, &cmd).expect("write cmd");
            let mut child = tokio::process::Command::new(bash)
                .arg(script.to_string_lossy().replace('\\', "/"))
                .env("SHELL", "/usr/bin/bash")
                .env("HOME", std::env::var("FLOOD_HOME").unwrap_or_default())
                .current_dir(std::env::var("FLOOD_HOME").unwrap_or_else(|_| ".".into()))
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .kill_on_drop(true)
                .spawn()
                .expect("bash");
            self.shells.lock().await.insert(ch, child.stdin.take().unwrap());
            for mut pipe in [Box::new(child.stdout.take().unwrap()) as Box<dyn tokio::io::AsyncRead + Unpin + Send>, Box::new(child.stderr.take().unwrap())] {
                let h = s.handle();
                tokio::spawn(async move {
                    let mut buf = [0u8; 4096];
                    while let Ok(n) = pipe.read(&mut buf).await {
                        if n == 0 { break; }
                        let fixed: Vec<u8> = buf[..n].iter().flat_map(|&b| if b == b'\n' { vec![b'\r', b'\n'] } else { vec![b] }).collect();
                        if h.data(ch, CryptoVec::from(fixed)).await.is_err() { break; }
                    }
                });
            }
            let h = s.handle();
            tokio::spawn(async move { let _ = child.wait().await; let _ = h.close(ch).await; });
            return Ok(());
        }
        let hist = "ls -la\n#1700000000\nsudo dnf upgrade -y\n: 1700000001:0;docker compose pull\ndocker compose up -d\ndocker logs -f jellyfin\nsystemctl status nginx\n";
        s.data(ch, CryptoVec::from(hist.to_string()))?;
        s.exit_status_request(ch, 0)?;
        s.eof(ch)?;
        s.close(ch)?;
        Ok(())
    }

    /// Echo keystrokes back (Enter -> newline), so typing can be verified end to end.
    async fn data(&mut self, ch: ChannelId, data: &[u8], s: &mut Session) -> Result<(), Self::Error> {
        if let Some(stdin) = self.shells.lock().await.get_mut(&ch) {
            use tokio::io::AsyncWriteExt;
            let echo: Vec<u8> = data.iter().flat_map(|&b| if b == b'\r' { vec![b'\r', b'\n'] } else { vec![b] }).collect();
            s.data(ch, CryptoVec::from(echo))?;
            let input: Vec<u8> = data.iter().map(|&b| if b == b'\r' { b'\n' } else { b }).collect();
            let _ = stdin.write_all(&input).await;
            return Ok(());
        }
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
    Flood { fps, shells: Default::default() }.run_on_address(Arc::new(cfg), ("127.0.0.1", port)).await.unwrap();
}
