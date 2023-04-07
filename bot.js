const {Client, GatewayIntentBits, EmbedBuilder} = require("discord.js");
const levenshtein = require("fast-levenshtein");
const sqlite3 = require("sqlite3");

const client = new Client({intents:[
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent
]});

const DiscordToken = "discord-token";
const db = new sqlite3.Database("biblia.db");

client.on("ready", () => {
	client.application.commands.create({
		name: "search",
		description: "Procura até 25 versículos em que aparece uma expressão.",
		options: [
		{
			name: "expression",
			description: "Expressão para pesquisar",
			type: 3,
			required: true
		},
		{
			name: "testament",
			description: "antigo ou novo",
			type: 3
		},
		{
			name: "book",
			description: "Nome do livro",
			type: 3
		},
		{
			name: "chapter",
			description: "Número do capítulo",
			type: 10
		}]
	});
	client.application.commands.create({
		name: "chapter",
		description: "Manda um capítulo.",
		options: [
		{
			name: "book",
			description: "Nome do livro",
			type: 3,
			required: true
		},
		{
			name: "chapter",
			description: "Número do capítulo",
			type: 10,
			required: true
		}]
	});
	client.application.commands.create({
		name: "verse",
		description: "Manda um versículo.",
		options: [
		{
			name: "book",
			description: "Nome do livro",
			type: 3,
			required: true
		},
		{
			name: "chapter",
			description: "Número do capítulo",
			type: 10,
			required: true
		},
		{
			name: "verse",
			description: "Número do versículo",
			type: 3,
			required: true
		}]
	});
	client.application.commands.create({
		name: "random",
		description: "Manda um versículo aleatório.",
		options: [
		{
			name: "testament",
			description: "antigo ou novo",
			type: 3
		},
		{
			name: "book",
			description: "Nome do livro",
			type: 3
		},
		{
			name: "chapter",
			description: "Número do capítulo",
			type: 10
		}]
	});
	console.log("Bible bot online!");
});

client.on("interactionCreate", async interaction => {
	if (interaction.commandName == "search") {
		const expression = interaction.options.getString("expression").trim();
		const testament = interaction.options.getString("testament")?.trim();
		const book = interaction.options.getString("book")?.trim();
		const chapter = interaction.options.getNumber("chapter");
		const correctBook = book && getCorrectBook(book);
		
		const passages = await getPassages(expression, testament, correctBook, chapter);
		
		if (passages.length == 0) {
			const embed = new EmbedBuilder()
				.setTitle(`Resultados para: "${expression}"`)
				.setDescription("Nada foi encontrado!")
				.setColor(0x964b00);
			
			interaction.reply({
				embeds: [embed],
				ephemeral: true
			});
			
			return;
		}
		
		const embed = new EmbedBuilder()
			.setTitle(`Resultados para: "${expression}"`)
			.setColor(0x964b00);
		
		passages.forEach((passage, index) => {
			if (index >= 25) return;
			
			let text = passage.text;
			const regex = RegExp(expression, "ig");
			
			text.match(regex).forEach(m => {
				text = text.replace(m, `**${m}**`);
			});
		
			embed.addFields({
				name: `${passage.book} ${passage.chapter}:${passage.verse}`,
				value: text
			})
		});
		
		interaction.reply({
			embeds: [embed]
		});
	}
	else if (interaction.commandName == "chapter") {
		const book = interaction.options.getString("book").trim();
		const chapter = interaction.options.getNumber("chapter");
		const correctBook = getCorrectBook(book);
		const description = await getChapter(correctBook, chapter);
		
		if (!description) {
			const embed = new EmbedBuilder()
				.setTitle(`${correctBook} ${chapter}`)
				.setDescription("Capítulo não encontrado!")
				.setColor(0x964b00);
			
			interaction.reply({
				embeds: [embed],
				ephemeral: true
			});
			
			return;
		}
		
		const chunks = [];
		const lines = description.split("\n");
		for (let i = 0; i < lines.length; i += 15) {
			chunks.push(lines.slice(i, i + 15));
		}
		
		const embeds = [];
		chunks.forEach(chunk => {
			if (chunk.join("\n").length == 0) return;
			
			const embed = new EmbedBuilder()
				.setTitle(`${correctBook} ${chapter}`)
				.setDescription(chunk.join("\n"))
				.setColor(0x964b00);
			
			embeds.push(embed);
		});
		
		interaction.reply({
			embeds: embeds
		});
	}
	else if (interaction.commandName == "verse") {
		const book = interaction.options.getString("book").trim();
		const chapter = interaction.options.getNumber("chapter");
		const verse = interaction.options.getString("verse");
		const correctBook = getCorrectBook(book);
		const description = await getVerse(correctBook, chapter, verse);
		
		if (!description) {
			const embed = new EmbedBuilder()
				.setTitle(`${correctBook} ${chapter}:${verse}`)
				.setDescription("Versículo não encontrado!")
				.setColor(0x964b00);
			
			interaction.reply({
				embeds: [embed],
				ephemeral: true
			});
			
			return;
		}
		
		const embed = new EmbedBuilder()
			.setTitle(`${correctBook} ${chapter}:${verse}`)
			.setDescription(description)
			.setColor(0x964b00);
		
		interaction.reply({
			embeds: [embed]
		});
	}
	else if (interaction.commandName == "random") {
		const testament = interaction.options.getString("testament")?.trim();
		const book = interaction.options.getString("book")?.trim();
		const chapter = interaction.options.getNumber("chapter");
		const correctBook = book && getCorrectBook(book);
		
		const random = await getRandom(testament, correctBook, chapter);
		
		const embed = new EmbedBuilder()
			.setTitle(`${random.book} ${random.chapter}:${random.verse}`)
			.setDescription(random.text)
			.setColor(0x964b00);
		
		interaction.reply({
			embeds: [embed]
		});
	}
});

client.login(DiscordToken);

function getCorrectBook(input) {
	const books = ["genesis", "exodo", "levitico", "numeros", "deuteronômio", "josue", "juizes", "rute", "1 samuel", "2 samuel", "1 reis", "2 reis", "1 cronicas", "2 cronicas", "esdras", "neemias", "ester", "jo", "salmos", "proverbios", "eclesiastes", "canticos", "isaias", "jeremias", "lamentacoes", "ezequiel", "daniel", "oseias", "joel", "amos", "obadias", "jonas", "miqueias", "naum", "habacuque", "sofonias", "ageu", "zacarias", "malaquias", "mateus", "marcos", "lucas", "joao", "atos", "romanos", "1 corintios", "2 corintios", "galatas", "efesios", "filipenses", "colossenses", "1 tessalonicenses", "2 tessalonicenses", "1 timoteo", "2 timoteo", "tito", "filemom", "hebreus", "tiago", "1 pedro", "2 pedro", "1 joao", "2 joao", "3 joao", "judas", "apocalipse"];
	
	input = input.toLowerCase();
	
	if (books.includes(input)) return input;
	
	let a = books.map(book => book.match(input)?.[0].length || 0);
	let b = books.map(book => levenshtein.get(book, input) - book.length);
	let c = a.map((n, i) => n - b[i]);
	
	const index = c.indexOf(Math.max(...c));
	return books[index];
}

function getPassages(expression, testament, book, chapter) {
	let more = "";
	
	if (testament == "antigo") more += `AND id < 23136 `;
	else if (testament == "novo") more += `AND id >= 23136 `;
	if (book) more += `AND book = "${book}" `;
	if (chapter) more += `AND chapter = "${chapter}" `;
	
	return get(`SELECT * FROM biblia WHERE text LIKE "%${expression}%" ${more} ORDER BY id`);
}

async function getChapter(book, chapter) {
	const verses = await get(`SELECT text FROM biblia WHERE book LIKE "${book}" AND chapter = "${chapter}" ORDER BY verse`);
	
	let n = 1;
	let text = "";
	verses.forEach(verse => {
		text += `${n++}. ` + verse.text + "\n";
	});
	return text;
}

async function getVerse(book, chapter, verse) {
	const rangeVerse = verse.split("-");
	const minVerse = rangeVerse?.[0] || verse;
	const maxVerse = rangeVerse?.[1] || verse;
	
	const verses = await get(`SELECT text FROM biblia WHERE book LIKE "${book}" AND chapter = "${chapter}" AND verse >= ${minVerse} AND verse <= ${maxVerse}`);
	
	let n = minVerse;
	let text = "";
	verses.forEach(verse => {
		text += `${n++}. ` + verse.text + "\n";
	});
	return text;
}

async function getRandom(testament, book, chapter) {
	let more = "";
	
	if (testament == "antigo") more += `AND id < 23136 `;
	else if (testament == "novo") more += `AND id >= 23136 `;
	if (book) more += `AND book = "${book}" `;
	if (chapter) more += `AND chapter = "${chapter}" `;
	
	const obj = await get(`SELECT * FROM biblia WHERE id = id ${more} ORDER BY RANDOM() LIMIT 1`);
	return obj[0];
}

function get(query) {
	return new Promise((resolve, reject) => {
		db.all(query, [], (err, rows) => {
			if (err) {
				reject(err);
			}
			else {
				resolve(rows);
			}
		});
	});
}