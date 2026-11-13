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

## Personalizar
A engrenagem na barra de título (ou `Ctrl+,`) abre o painel de personalização, tudo aplicado na hora:

- **Tema:** 8 temas prontos, cor de destaque (paleta ou qualquer cor), papel de parede (8 gradientes, cor sólida ou imagem sua, com escurecer/desfocar), transparência do app e dos blocos, cor e intensidade do vidro
- **Terminal:** fonte, tamanho, peso, altura da linha, espaço entre letras, esquema de cores, contraste mínimo, formato e piscar do cursor, margem interna, histórico de linhas
- **Interface:** fonte da interface, escala, arredondamento, densidade, barra lateral (mostrar/ocultar, largura), botões da janela estilo Windows ou macOS, animações
- **Servidores:** ícone personalizado para cada máquina
- **Exportar / Importar** o tema pela área de transferência para levar a outro PC

## Prompt moderno
Ao conectar, o terminal ganha um prompt em "flags" de vidro (pílulas arredondadas e translúcidas): **usuário@máquina · pasta · git**
(branch e alterações: `✚` preparados, `●` modificados, `?` novos, `⇡⇣` à frente/atrás), duração de comandos
longos e código de erro; o `❯` fica vermelho quando o último comando falha. A barra do terminal mostra a
pasta atual (clique para copiar) e a branch, e a aba mostra o nome da pasta.

- Personalizável em **Personalizar → Prompt**: formato (vidro, setas powerline, pílulas, diagonal ou texto), opacidade das
  flags, o que mostrar, cor de cada flag, comando na mesma linha ou na de baixo, pasta completa ou curta —
  com pré-visualização ao vivo. Mudanças valem para as próximas conexões.
- **Nada é alterado no servidor:** o prompt vale só para a sessão do app (o bash é iniciado com uma
  configuração temporária que se apaga sozinha). Funciona com bash; zsh e fish mantêm o prompt de vocês.
- As setas são desenhadas pela GPU (renderizador WebGL), sem precisar instalar fontes especiais.
- O prompt se ajusta à largura do terminal (esconde/encurta partes menos importantes), e a barra do
  terminal se adapta à largura da janela.

## Buscar e sugestões
- **Lupa** (ícone no topo do terminal ou `Ctrl+Shift+F`): busca na saída e no histórico de rolagem, destaca todas as ocorrências, mostra "3 de 12", com maiúsculas/minúsculas, palavra inteira e regex. `Enter`/`Shift+Enter` ou `F3` navegam.
- **Sugestões de comandos:** enquanto você digita, aparecem comandos do histórico do próprio servidor (bash, zsh ou fish, lido ao conectar) e do que você rodou na sessão. `↑↓` escolhem, `→` aceita, `Esc` fecha; o `Tab` continua sendo o autocomplete do shell. Senhas digitadas (que não aparecem na tela) nunca entram no histórico, nada é gravado em disco e as sugestões somem dentro de vim/htop. Dá para desligar em Personalizar → Terminal.

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
| Buscar no terminal | `Ctrl+Shift+F` · `F3` / `Shift+F3` |
| Sugestões | `↑↓` escolher · `→` aceitar · `Esc` fechar |
| Personalizar / barra lateral | `Ctrl+,` / `Ctrl+Shift+B` |
| Abrir já conectado | `"SSH Connector.exe" --connect "Nome da máquina"` |
| Aparência (transparência, fonte) | `Ctrl+,` · engrenagem na barra de título |
| Trocar / fechar aba | `Ctrl+Tab` / `Ctrl+Shift+W` |
