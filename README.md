# SSH Connector

Cliente SSH minimalista em estilo liquid glass (Tauri 2 + Rust/russh + xterm.js).

![SSH Connector](docs/screenshot.png)

- **Download:** [`SSH-Connector.exe`](https://github.com/joaoluft/liquid-glass-ssh-connector/releases/latest) (portátil, ~4,5 MB; usa o WebView2 do Windows)
- Configuração: `%APPDATA%\SSHConnector\config.json` (senhas cifradas com DPAPI do Windows)

## Compilar
```
cd src-tauri
cargo build --release
copy target\release\ssh-connector.exe "..\dist\SSH Connector.exe"
```

## Atalhos
Ctrl+N nova máquina · Ctrl+F buscar · Ctrl+Tab trocar aba · Ctrl+Shift+W fechar aba
Ctrl+Shift+C copiar · Ctrl+V colar · botão direito: copia seleção / cola
