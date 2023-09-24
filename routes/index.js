// Imports
const express = require('express');
const router = express.Router();
const fs = require('fs'); //interacts with files

// Import database
const connection = require('../database');
const sendSqlQuery = require('../database');

// Routes
router.get('/', (req, res) => {
	res.render('index');
});

router.post('/', (req, res) => {
	let message = req.body.message;
	let author = 'Anonymous';
	let isOffensive = isMessageOffensive(message);
	sendSqlQuery(
		`INSERT INTO messages (message, author, isOffensive) VALUES (?,?,?)`,
		[message, author, isOffensive]
	);
	res.redirect('/');
});

const swearWords = fs.readFileSync('bannedWords.txt', 'utf-8').split(/\r?\n/);
function isMessageOffensive(message) {
	for (word in swearWords) {
		if (message.toLowerCase().includes(swearWords[word])) return true;
	}

	return false;
}

// Export the router
module.exports = router;
