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
// Gets the last n messages from the database and renders the index page
router.get('/', async (req, res) => {
	try {
		let messageArray = await getMessageArray();

		// Getting error message
		let error = await req.query.error;
	
		res.render('index', { messages: messageArray, error : error});
	
		//records activity in database
		sendSqlQuery(
			'UPDATE users SET lastActiveDate = CURRENT_TIMESTAMP WHERE token = ?',
			[req.cookies.userToken]
		);
	} catch (error) {
		console.log(`An error occured while loading the index page: ${error}`);
		let errorMessage = await encodeURIComponent('An error occured while loading the index page');
		return res.redirect(`/?error=${errorMessage}`);
	}
});

// POST index route
// Lets you send a message
// Gets message from POST request and inserts it into the database
router.post('/', async (req, res) => {
	try {
		let message = await req.body.message;
		let authorToken = await req.cookies.userToken;
		let isOffensive = await isMessageOffensive(message);

		// Get author id and if hes banned
		let authorId = await sendSqlQuery(
			'SELECT id, isBanned FROM users WHERE token = ?',
			[authorToken],
			true
		);

		authorIsBanned = authorId[0].isBanned;
		if (authorIsBanned) {
			console.log(`User ${authorId} tried to send a message while banned`);
			let errorMessage = await encodeURIComponent('You are banned and cannot send messages');
			return res.redirect(`/?error=${errorMessage}`)
		}

		if (message.replace(/\s/g, '').length == 0){
			console.log(`User ${authorId} tried to send only spaces`);
			let errorMessage = await encodeURIComponent('You cannot send only spaces');
			return res.redirect(`/?error=${errorMessage}`)
		}

		authorId = authorId[0].id;

		console.log(`User ${authorId} sent a message`);

		// Check if user exists
		if (authorId == undefined) {
			throw new Error('User does not exist');
			console.log(`User ${authorId} tried to send a message but does not exist`);
			let errorMessage = await encodeURIComponent('User does not exist');
		}

		await sendSqlQuery(
			`INSERT INTO messages (message, author, isOffensive) VALUES (?,?,?)`,
			[message, authorId, isOffensive]
		);

		return res.redirect('/');
	} catch (error) {
		console.log(`An error occured while sending a message: ${error}`);
		let errorMessage = await encodeURIComponent('An error occured while sending a message');
		return res.redirect(`/?error=${error}`);
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
	try {
		for (word in swearWords) {
			if (message.toLowerCase().includes(swearWords[word])) return true;
		}
	
		return false;
	} catch (error) {
		throw new Error(`An error occured while checking if a message is offensive: ${error}`);
	}
}

/**
 * Gets the last few messages from the database
 * @returns {array} An array of the last 10 messages
 */
async function getMessageArray() {
	try {
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
	
		// Reverse the array
		messageArray.reverse();
	
		return messageArray;
	} catch (error) {
		throw new Error(`An error occured while getting the message array: ${error}`);
	}
}

// Export the router
module.exports = router;
