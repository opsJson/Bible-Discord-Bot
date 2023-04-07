# Bible-Discord-Bot

### Comandos

```/random```  
Manda um versículo aleatório.  

```/chapter [book] [chapter]```  
Manda o capítulo completo de um livro.  
Ex: /chapter g 1

```/verse [book] [chapter] [verse]```  
Manda os versículos selecionados de um capítulo  
Ex: /verse gensis 6 1-7

```/search [expression] [book?] [chapter?] [testament?]```  
Procura por uma expressão, retornando no máximo 25 resultados.  
Você pode limitar a pesquisa por livros, capítulos ou testamento.  
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
