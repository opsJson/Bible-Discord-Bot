# Bible-Discord-Bot

### Comandos

```/random [testament?] [book?] [chapter?]```  
Manda um versículo aleatório.  
Ex: /random antigo

```/chapter [book] [chapter]```  
Manda o capítulo completo de um livro.  
Ex: /chapter g 1

```/verse [book] [chapter] [verse]```  
Manda os versículos selecionados de um capítulo  
Ex: /verse gensis 6 1-7

```/search [expression] [testament?] [book?] [chapter?]```  
Procura por uma expressão, retornando no máximo 25 resultados.  
Você pode limitar a pesquisa por testamento, livro ou capítulo.  
Ex: /search jesus

### Quick Start
Mude ```DiscordToken``` para o token do seu bot.

```bash
npm init -y
npm install discord.js
npm install fast-levenshtein
npm install sqlite3
node .
```
