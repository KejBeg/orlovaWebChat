// Import database
const mysql = require('mysql');

// Database connection
const connection = mysql.createConnection({
	host: process.env.DATABASE_HOST,
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

			console.log('SQL query sent successfully');

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
	isBanned BOOLEAN DEFAULT 0,
	storyQuestion INT DEFAULT 0,
	FOREIGN KEY (storyQuestion) REFERENCES storyMessages(id),
	userCreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	lastActiveDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`;

console.log('Generating tables');

// Create User table and make anonymous account
createUserTable(usersTable);

// Create Story mesages table
sendSqlQuery(storyTable);

// Create message table
sendSqlQuery(messageTable);

// Creates story questions if they werent created yet
setupStoryQuestions();

// Exports
module.exports = {
	connection: connection,
	sendSqlQuery: sendSqlQuery,
};

async function createUserTable(usersTable){

	// Create users table
	await sendSqlQuery(usersTable);

	// Create Anonymous user if it doesn't exist
	sendSqlQuery(
		`INSERT IGNORE INTO users (id, username, password, token) VALUES (1, 'Anonymous', 'Anonymous', 'Anonymous')`
	);	

	sendSqlQuery(
		`INSERT IGNORE INTO users (id, username, password, token) VALUES (0, 'Admin', 'ADMIN3363', 'testadmin')`
	);	
}

async function setupStoryQuestions(){
	firstQuestion = await sendSqlQuery(
		`SELECT question FROM storyMessages WHERE id = 0;`,
		[],
		true
	);
	try{ 
		if(firstQuestion[0]['question'] != null) return;
	}
	catch(err) {
		//ignore (trust me its okay)
	}

	console.log('Insetring questions into storyMessages table');

	setupStoryQuery = `
		INSERT INTO storyMessages VALUES 
			('0', 'Ahoj!', 'Ahoj.', NULL, NULL, '1', NULL, NULL),
			('1', 'Chceš se naučit něco o netolismu a závislosti na internetu?', 'Ano!', 'ani ne..', NULL, '3', '2', NULL),
			('2', 'KONEC ---------------', NULL, NULL, NULL, NULL, NULL, NULL),
			('3', 'Tak Jdeme na to! Víš něco o neolitismu?', 'Ano', 'Ne', 'Co to je neolitismus?', '4', '9', '9'),
			('4', 'Co je to neolitismus?', 'Je to nakupování drog přes internet', 'Je to závislost na "Virtuálních drogách', '..nějaký fetish?', '5', '6', '5'),
			('5', 'Špatně zkus ještě jednou. Co je to neolitismus?', 'Je to nakupování drog přes internet', 'Je to závislost na "Virtuálních drogách', '..nějaký fetish?', '5', '6', '5'),
			('6', 'Co to znamená "virtuální drogy"?', 'Vyhledávání drog online', 'Užívání drog s lidma na internetu', 'Závislost na PC, sociálních sítích a podobně', '7', '7', '8'),
			('7', 'Špatně zkus to ještě jednou. Co to znamená "virtuální drogy"?', 'Vyhledávání drog online', 'Užívání drog s lidma na internetu', 'Závislost na PC, sociálních sítích a podobně', '7', '7', '8'),

			('9', 'Tak se o neolitismu něco naučíme!', 'Jupii!', NULL, NULL, 10, NULL, NULL),
			('10', 'Tak čti pořádně na konci bude test! Netolismus je závislost na "virtuálních drogách"', 'Co to jsou virtuální drogy?', NULL, NULL, '11', NULL, NULL),
			('11', '"Virtuální drogy" jsou pojem označující závislost na sociálních sítích, PC, telefonu a podobně. Pochopeno?', 'Ano!', 'ještě bych si to radši zopakoval', NULL, '12', '0', NULL),
			('12', 'Super! tak jdeme na test. ', 'Jsem připravený!', NULL, NULL, '4', NULL, NULL),

			('8', 'Správně, Teď jedna otázka. Kolik času strávíš denně na sociálních sítích? (např. Instagram, Snapchat, TikTok apod.', 'NEDOKONČENO', 'NEDOKONČENO', 'NEDOKONČENO', '0', '0', '0');
	`
	sendSqlQuery(setupStoryQuery);
}
