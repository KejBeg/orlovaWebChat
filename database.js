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

// Creating Tables
messageTable = `CREATE TABLE IF NOT EXISTS messages (message TEXT)`;
connection.query(messageTable, (error, result) => {
	if (error) {
		console.log(`An error occured while creating the table ${error}`);
	} else {
		console.log('Table created successfully');
	}
});

module.exports = connection;
