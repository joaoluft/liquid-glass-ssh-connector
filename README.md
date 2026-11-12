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

## Área de transferência
O app tem um clipboard próprio (botão na barra de título ou `Ctrl+Shift+V`): tudo que você copia em
qualquer terminal fica num histórico, e um clique cola o item no terminal ativo, ideal para levar comandos
de uma máquina para outra. Itens podem ser fixados. O histórico fica só na memória e some ao fechar o app.

## Atalhos
| Ação | Atalho |
| --- | --- |
| Copiar seleção | `Ctrl+C` (com texto selecionado) · `Ctrl+Shift+C` · `Ctrl+Insert` |
| Colar | `Ctrl+V` · `Shift+Insert` |
| Área de transferência | `Ctrl+Shift+V` · teclas `1`–`9` colam um item com o painel aberto |
| Menu do terminal | clique direito (copiar, colar, selecionar tudo, limpar) |
| Nova máquina / buscar | `Ctrl+N` / `Ctrl+F` |
| Trocar / fechar aba | `Ctrl+Tab` / `Ctrl+Shift+W` |
