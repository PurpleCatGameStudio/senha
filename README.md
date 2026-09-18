# Senha

Jogo diário de palavras onde você deve descobrir a senha. feito com HTML, CSS e JavaScript puro.

## Rodando localmente

Abra `index.html` em um navegador.

Para desenvolvimento, também é possível usar qualquer servidor HTTP local.

## GitHub Pages

1. Crie um repositório chamado `plavra` no GitHub.
2. Envie `index.html`, `style.css`, `script.js`, `words.js` e `README.md` para a raiz do repositório.
3. Abra **Settings > Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`.
6. Salve e aguarde o GitHub Pages publicar o site.

## Estrutura

- `index.html`: estrutura da página e modal de instruções.
- `style.css`: interface responsiva.
- `script.js`: regras, estado, teclado, tentativas e palavra diária.
- `words.js`: banco de palavras válidas e palavras utilizadas pelo jogo.

## Estado do jogo

O progresso do dia é salvo no `localStorage` do navegador. Cada dia possui uma palavra determinada pelo índice do dia desde 1º de janeiro de 2026.

O jogo não possui backend, banco de dados ou dependências externas.
