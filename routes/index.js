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

	// Cookie setup
	if (req.cookies.username == undefined) {
		// TODO
	}

	res.render('index', { messages: messageArray });
});

router.post('/', async (req, res) => {
	try {
		let message = await req.body.message;
		let author = (await req.cookies.username) || 'Anonymous';
		let isOffensive = await isMessageOffensive(message);
		await sendSqlQuery(
			`INSERT INTO messages (message, author, isOffensive) VALUES (?,?,?)`,
			[message, author, isOffensive]
		);

		return res.redirect('/');
	} catch (error) {
		console.log(`An error occured while sending a message: ${error}`);
		return res.redirect('/');
	}
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
