// Smoke test for the clipboard bridge used by clip_read / clip_write.
fn main() {
    let mut c = arboard::Clipboard::new().expect("open clipboard");
    c.set_text("ssh-connector clip test ✓".to_string()).expect("set");
    drop(c);
    let got = arboard::Clipboard::new().unwrap().get_text().unwrap();
    println!("roundtrip: {got}");
}
