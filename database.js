// Import database
const mysql = require('mysql');

// Database connection
const connection = mysql.createConnection({
	host: process.env.DATABASE_HOST,
	port: process.env.DATABASE_PORT,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME,
	insecureAuth: true,
});

connection.connect((error) => {
	if (error) {
		console.log(`An error occured while connecting to the database ${error}`);
	} else {
		console.log('Connected to the database');
	}
});

/**
 * Sends a SQL query to the database
 * @param {string} sql The SQL query to send
 * @param {boolean} read Whether the query should return a result or not
 * @param {object} dataInsertion The data to insert into the query
 * @returns {object} The result of the query
 **/
async function sendSqlQuery(sql, dataInsertion, read = false) {
	return new Promise((resolve, reject) => {
		connection.query(sql, dataInsertion, (error, result) => {
			// Error handling
			if (error) {
				reject(error);
				return;
			}

			//už mě to reálně sere ať mi to napíše když to selže ne když to neselže když je to v pohodě tak mě to nezajíma tak ať je ticho
			//console.log('SQL query sent successfully');

			// Turn the result into a JSON
			result = JSON.parse(JSON.stringify(result));

			// If the query is a read query, return the result
			if (read) {
				resolve(result);
				return;
			}

			// If the query is not a read query, just return
			resolve();
			return;
		});
	});
}

//sets database timezone
timeZoneQuery = `
	SET GLOBAL time_zone = '+4:00';
`;
// Creating Tables

// Message table
messageTable = `CREATE TABLE IF NOT EXISTS messages (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	message TEXT,
	author INT,
	isOffensive BOOLEAN,
	FOREIGN KEY (author) REFERENCES users(id)
)`;

// Story mode messages table
// Question leads to several entities with an answer and another question
storyTable = `CREATE TABLE IF NOT EXISTS storyMessages (
	id INT NOT NULL PRIMARY KEY,
	question TEXT,
	answer1 TEXT,
	answer2 TEXT,
	answer3 TEXT,
	answer1Id INT,
	answer2Id INT,
	answer3Id INT
)`;

// Users table
usersTable = `CREATE TABLE IF NOT EXISTS users (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	username TEXT,
	password TEXT,
	token TEXT,
	hasProfilePicture BOOLEAN DEFAULT 0,
	theme TEXT,
	isBanned BOOLEAN DEFAULT 0,
	storyQuestion INT DEFAULT 0,
	FOREIGN KEY (storyQuestion) REFERENCES storyMessages(id),
	userCreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	lastActiveDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`;

console.log('Generating tables');


async function createTables() {

	// Sets correct time zone for database (GTML+2 time)
	// await sendSqlQuery(timeZoneQuery);
	
	// Story messages needs to be first because users table references it
	// Create Story mesages table
	await sendSqlQuery(storyTable);

	// Create users table
	await sendSqlQuery(usersTable);

	// Create message table
	await sendSqlQuery(messageTable);

}

async function createDefaultUsers() {

	// Creating default users
	// Create Anonymous user if it doesn't exist
	await sendSqlQuery(
		`INSERT IGNORE INTO users (id, username, password, token, theme) VALUES (1, 'Anonymous', 'Anonymous', 'Anonymous', "random")`
	);

	// Create Admin user if it doesn't exist
	await sendSqlQuery(
		`INSERT IGNORE INTO users (id, username, password, token, theme) VALUES (2, 'ADMIN', 'testadmin', 'ADMIN3363', "autumn")`
	);
}

async function setupStoryQuestions(){
	let firstQuestion = await sendSqlQuery(
		`SELECT question FROM storyMessages WHERE id = 0;`,
		[],
		true
	);

	firstQuestion = await firstQuestion[0];
	
	if (firstQuestion != null) return;


	console.log('Inserting questions into storyMessages table');

	setupStoryQuery = `
	INSERT INTO storyMessages VALUES 
	('0', 'Ahoj!', 'Ahoj.', NULL, NULL, '1', NULL, NULL),
	('1', 'Chceš se naučit něco o netolismu a závislosti na internetu?', 'Ano!', 'ani ne..', NULL, '3', '2', NULL),
	('2', 'Tak až si to rozmyslíš tak jdi zpátky na začátek', 'Jít na začátek', NULL, NULL, 0, NULL, NULL),
	('3', 'Tak Jdeme na to! Víš něco o netolismu?', 'Ano', 'Ne', 'Co to je neolitismus?', '4', '9', '9'),
	('4', 'Co je to netolismus?', 'Je to nakupování drog přes internet', 'Je to závislost na "Virtuálních drogách', '..nějaký fetish?', '5', '6', '5'),
	('5', 'Špatně zkus ještě jednou. Co je to netolismus?', 'Je to nakupování drog přes internet', 'Je to závislost na "Virtuálních drogách', '..nějaký fetish?', '5', '6', '5'),
	('6', 'Co to znamená "virtuální drogy"?', 'Vyhledávání drog online', 'Užívání drog s lidma na internetu', 'Závislost na PC, sociálních sítích a podobně', '7', '7', '8'),
	('7', 'Špatně zkus to ještě jednou. Co to znamená "virtuální drogy"?', 'Vyhledávání drog online', 'Užívání drog s lidma na internetu', 'Závislost na PC, sociálních sítích a podobně', '7', '7', '8'),
	
	('9', 'Tak se o neolitismu něco naučíme!', 'Jupii!', NULL, NULL, 10, NULL, NULL),
	('10', 'Tak čti pořádně na konci bude test! Netolismus je závislost na "virtuálních drogách"', 'Co to jsou virtuální drogy?', NULL, NULL, '11', NULL, NULL),
	('11', '"Virtuální drogy" jsou pojem označující závislost na sociálních sítích, PC, telefonu a podobně. Pochopeno?', 'Ano!', 'ještě bych si to radši zopakoval', NULL, '12', '0', NULL),
	('12', 'Super! tak jdeme na test. ', 'Jsem připravený!', NULL, NULL, '4', NULL, NULL),
	
	('8', 'Správně, Teď jedna otázka. Kolik času strávíš denně na sociálních sítích? (např. Instagram, Snapchat, TikTok apod.', 'Méně jak 3 hodiny denně', '3 až 6 hodin denně', 'Více než 6 hodin', '13', '14', '15'),

	('13', 'Dobrá práce! Tím pádem nejspíše nejsi závislý', 'Jupii', NULL, NULL, '16', NULL, NULL),
	('14', 'To je normální čas pro člověka aby trávil na počítači', 'Ok', NULL, NULL, '16', NULL, NULL),
	('15', 'Už se blížíš, a nebo jsi závislý. Bylo by dobré, kdyby ses pokusil trávit méně času u počítače', 'Nechci trávit méně času u PC', 'Pokusím se trávit méně času u PC', NULL, '16', '16', NULL),
	
	('16', 'Teď si řekneme o příznacích netolismu, dobře?', 'Ano!', NULL, NULL, 17, NULL, NULL),
	('17', 'Hlavnímy příznaky netolismu jsou: Neodtržitelnost od internetu, ignorace okolí, Nedodržování pitného a stravovacího režimu, agrese při absenci internetu, Chybějící koníčky netýkající se sociálních sítí a počítačů', 'Dále..', NULL, NULL, '18', NULL, NULL),
	('18', 'Následky netolismu mohou být: ztráta koníčků, bolest páteře, ztráta sociální schopnosti', 'Ok!', NULL, NULL, 19, NULL, NULL),
	('19', 'Teď malé opakování!', 'Jsem připravený!', 'Ještě bych si to zopakoval..', NULL, '20', '17', NULL),
	('20', 'Jaké jsou příznaky netolismu?', 'Neodtržitelnost od PC a sociálních sítí', 'Špatný zrak, bolest nohou', 'Zvýšené sociální schopnosti', '22', '21', '21'),
	('21', 'Špatně! zopakuj si to znova', 'Dobře..', NULL, NULL, '17', NULL, NULL),
	('22', 'Správně!', 'Pokračovat', NULL, NULL, '23', NULL, NULL),
	('23', 'Co jsou následky netolismu?', 'Žádné pokud jsem opatrný', 'Ztráta přátel a zhoršené vidění', 'Bolest kloubů - hlavně loktu', '21', 24, '21'),
	('24', 'Správně!', 'Jupii!', NULL, NULL, '25', NULL, NULL),
	('25', 'Tak doufám, že ses něco nakonec naučil o netolismu!', 'Ano, děkuju!', NULL, NULL, '26', NULL, NULL),
	('26', 'Tak naschledanou příště! Autoři: Honza, Kuba, Sam a Robert','Můžu si to ještě zopakovat?', NULL, NULL, '1', NULL, NULL);
	`

	// Inserting questions into storyMessages table
	await sendSqlQuery(setupStoryQuery);
}

async function setupDatabase() {
	// Creating tables
	await createTables();

	// Setting up story questions
	await setupStoryQuestions();

	// Creating default users
	await createDefaultUsers();
}

setupDatabase();

// Exports
module.exports = {
	connection: connection,
	sendSqlQuery: sendSqlQuery,
};