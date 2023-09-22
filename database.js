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

function getSqlData(sql, callback) {
	connection.query(sql, (error, result) => {
		if (error) {
			throw error;
		}
		log(result);
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

// Users table
usersTable = `CREATE TABLE IF NOT EXISTS users (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	username TEXT,
	password TEXT
)`;

// Story mode messages table 
// Question leads to several entities with an answer and another question
storyTable = `CREATE TABLE IF NOT EXISTS storyMessages (
	id INT NOT NULL UNIQUE PRIMARY KEY,
	answer TEXT,
	guestion TEXT,
	answer1Id INT,
	answer2Id INT,
	answer3Id INT,
	FOREIGN KEY (answer1Id) REFERENCES storyMessages(id),
	FOREIGN KEY (answer2Id) REFERENCES storyMessages(id),
	FOREIGN KEY (answer3Id) REFERENCES storyMessages(id)
)`;

// Create message table
connection.query(messageTable, (error, result) => {
	if (error) {
		console.log(`An error occured while creating the table ${error}`);
	} else {
		console.log('Table messageTable created successfully');
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

// Create Story mesages table
connection.query(storyTable, (error, result) => {
	if (error) {
		console.log(`An error occured while creating the table ${error}`);
	} else {
		console.log('Table storyTable created successfully');
	}
});

module.exports = connection;
