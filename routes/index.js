// Imports
const express = require('express');
const router = express.Router();
const fs = require('fs'); //interacts with files

// Import database
const connection = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;

// Routes
router.get('/', async (req, res) => {
	messageArray = await getMessageArray();
	res.render('index', { messages: messageArray });
});

router.post('/', async (req, res) => {
	let message = await req.body.message;
	let author = await 'Anonymous';
	let isOffensive = await isMessageOffensive(message);
	sendSqlQuery(
		`INSERT INTO messages (message, author, isOffensive) VALUES (?,?,?)`,
		[message, author, isOffensive]
	)
		.then(() => {
			res.redirect('/');
		})
		.catch((error) => {
			res.redirect('/');
		});
});

const swearWords = fs.readFileSync('bannedWords.txt', 'utf-8').split(/\r?\n/);
function isMessageOffensive(message) {
	for (word in swearWords) {
		if (message.toLowerCase().includes(swearWords[word])) return true;
	}

	return false;
}

async function getMessageArray() {
	messageArray = await new Promise(function (resolve, reject) {
		connection.query(
			`SELECT * FROM messages ORDER BY id DESC LIMIT 10`,
			(error, result) => {
				if (error) {
					console.log(`An error occured while accesing the message ${error}`);
					return reject(error);
				}

				//messageArray = Object.values(result).map((messages) => messages.message);
				//messageArray = JSON.parse(result);
				messageArray = result;
				resolve(messageArray.reverse());
			}
		);
	});

	return messageArray;
}
// Export the router
module.exports = router;
