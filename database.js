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
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	answer TEXT,
	question TEXT,
	answer1Id INT,
	answer2Id INT,
	answer3Id INT,
	FOREIGN KEY (answer1Id) REFERENCES storyMessages(id),
	FOREIGN KEY (answer2Id) REFERENCES storyMessages(id),
	FOREIGN KEY (answer3Id) REFERENCES storyMessages(id) 
)`;

// Users table
usersTable = `CREATE TABLE IF NOT EXISTS users (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	username TEXT,
	password TEXT,
	token TEXT,
	storyQuestion INT DEFAULT 0,
	FOREIGN KEY (storyQuestion) REFERENCES storyMessages(id),
	userCreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`;
// storyQuestion INT DEFAULT 0
// FOREIGN KEY (storyQuestion) REFERENCES storyMessages(id)

console.log('Generating tables');

// Create users table
sendSqlQuery(usersTable);

// Create message table
sendSqlQuery(messageTable);

// Create Story mesages table
sendSqlQuery(storyTable);

// Create Anonymous user if it doesn't exist
sendSqlQuery(
	`INSERT IGNORE INTO users (id, username, password, token) VALUES (1, 'Anonymous', 'Anonymous', 'Anonymous')`
);

// Exports
module.exports = {
	connection: connection,
	sendSqlQuery: sendSqlQuery,
};
