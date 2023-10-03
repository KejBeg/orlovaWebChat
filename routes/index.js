// Imports
const express = require('express');
const router = express.Router();
const fs = require('fs'); //interacts with files
const { parse } = require('path');

// Import database
const connection = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;

// Routes

// GET index route
// Gets the last 10 messages from the database and renders the index page
router.get('/', async (req, res) => {
	messageArray = await getMessageArray();

	res.render('index', { messages: messageArray });
});

// POST index route
// Lets you send a message
// Gets message from POST request and inserts it into the database
router.post('/', async (req, res) => {
	try {
		let message = await req.body.message;
		let authorToken = await req.cookies.userToken;
		let isOffensive = await isMessageOffensive(message);

		// Get author id
		let authorId = await sendSqlQuery(
			'SELECT id FROM users WHERE token = ?',
			[authorToken],
			true
		);

		authorId = authorId[0].id;

		console.log(`User ${authorId} sent a message`);

		// Check if user exists
		if (authorId == undefined) {
			throw new Error('User does not exist');
		}

		await sendSqlQuery(
			`INSERT INTO messages (message, author, isOffensive) VALUES (?,?,?)`,
			[message, authorId, isOffensive]
		);

		return res.redirect('/');
	} catch (error) {
		console.log(`An error occured while sending a message: ${error}`);
		return res.redirect('/');
	}
});

// Loading up the banned words for use in the isMessageOffensive function
const swearWords = fs.readFileSync('bannedWords.txt', 'utf-8').split(/\r?\n/);

/**
 * Checks if a message contains any forbidden words
 * @param {string} message the message to check for any forbidden words
 * @returns
 */
function isMessageOffensive(message) {
	for (word in swearWords) {
		if (message.toLowerCase().includes(swearWords[word])) return true;
	}

	return false;
}

/**
 * Gets the last few messages from the database
 * @returns {array} An array of the last 10 messages
 */
async function getMessageArray() {
	// Getting the messages from the database
	let messageArray = await sendSqlQuery(
		`SELECT *
		FROM messages
		JOIN users ON messages.author = users.id
		ORDER BY time DESC
		LIMIT ?
		`,
		[parseInt(process.env.GET_MESSAGE_LIMIT)],
		true
	);
	// Q: how do i convert a string of numbers into an int
	// A: parseInt()

	// Reverse the array
	messageArray.reverse();

	return messageArray;
}

// Export the router
module.exports = router;
