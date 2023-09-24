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

function sendSqlQuery(sql, read = false) {
	connection.query(sql, dataInsertion, (error, result) => {
		// If there is an error, log it and return
		if (error) {
			console.log(`An error occured while sending SQL query: ${error}`);
			return;
		}

		console.log('SQL query sent successfully');

		// If the query is a read query, return the result
		if (read) {
			console.log(`Returning result from SQL query: ${result}`);
			return result;
		}
	});
}

// Creating Tables

// Message table
messageTable = `CREATE TABLE IF NOT EXISTS messages (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	message TEXT,
	author TEXT,
	isOffensive BOOLEAN
)`;

// Story mode messages table
// Question leads to several entities with an answer and another question
storyTable = `CREATE TABLE IF NOT EXISTS storyMessages (
	id INT NOT NULL UNIQUE PRIMARY KEY,
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
	userCreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	storyQuestion INT,
	FOREIGN KEY (storyQuestion) REFERENCES storyMessages(id)
)`;

// Create message table
connection.query(messageTable, (error, result) => {
	if (error) {
		console.log(`An error occured while creating the table ${error}`);
	} else {
		console.log('Table messageTable created successfully');
	}
});

// Create Story mesages table
connection.query(storyTable, (error, result) => {
	if (error) {
		console.log(`An error occured while creating the table ${error}`);
	} else {
		console.log('Table storyTable created successfully');
	}
});

// Create users table
connection.query(usersTable, (error, result) => {
	if (error) {
		console.log(`An error occured while creating the table ${error}`);
	} else {
		console.log('Table usersTable created successfully');
	}
});

module.exports = connection;
