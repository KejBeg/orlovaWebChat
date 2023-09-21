// Imports
const express = require('express');
const router = express.Router();
const fs = require('fs'); //interacts with files

// Import database
const connection = require('../database');

// Routes
router.get('/', (req, res) => {
	res.render('index');
});

router.post('/', (req, res) => {
	let message = req.body.message;
	let author = 'Anonymous';
	let isOffensive = isMessageOffensive(message);
	connection.query(
		`INSERT INTO messages (message, author, isOffensive) VALUES (?,?,?)`,
		[message, author, isOffensive],
		(error, result) => {
			if (error) {
				console.log(`An error occured while inserting the message ${error}`);
			} else {
				console.log('Message inserted successfully');
			}
		}
	);

	res.redirect('/');
});

const swearWords = fs.readFileSync('bannedWords.txt', 'utf-8').split('\n');
function isMessageOffensive(message) {
	for (word of swearWords) {
		if (message.includes(word)) return true;
	}

	return false;
}

// Export the router
module.exports = router;
