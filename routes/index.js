// Imports
const { log } = require('console');
const express = require('express');
const router = express.Router();
const fs = require('fs'); //interacts with files
const socketIoImport = require('socket.io')

// Import database
const connection = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;

// TODO
// Setting up socket IO with CORS
const socketIo = socketIoImport(process.env.SOCKETIO_PORT, {
	cors: {
		origin: [`http://localhost:${process.env.WEB_PORT}`]
	}
})

// Socket IO connection
socketIo.on('connect', async (socket) => {
	console.log(`Connected to socketIO, token: ${socket.id}`);

	// Sending the message array to the client
	let messageArray = await getMessageArray();
	socket.emit('recieveMessage', messageArray);

	// Realtime sending ofm messages
	socket.on('sendMessage', (data) => sendMessage(data));
	
});

/**
 * When a client sends a message, this function is called 
 * and the message is sent to the database,
 * and then all the messages sent to all the clients.
 * @param {object} data data that is being sent from the client
 */
async function sendMessage(data) {
	try {
		const userToken = await data.userToken;
		const message = await data.message;

		// Getting if the message is offensive
		const isOffensive = await isMessageOffensive(message);

		// Get author id and if hes banned
		let authorId = await sendSqlQuery(
			'SELECT id, isBanned FROM users WHERE token = ?',
			[userToken],
			true
		);

		authorIsBanned = authorId[0].isBanned;
		if (authorIsBanned) {
			console.log(`User ${authorId} tried to send a message while banned`);
			let errorMessage = await encodeURIComponent('You are banned and cannot send messages');
			return res.redirect(`/?error=${errorMessage}`)
		}

		if (message.replace(/\s/g, '').length == 0) {
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

		// Inserting message into database
		await sendSqlQuery(
			`INSERT INTO messages (message, author, isOffensive) VALUES (?,?,?)`,
			[message, authorId, isOffensive]
		);

		// Get message array
		let messageArray = await getMessageArray()

		// Sending the latest message array to the client
		// socketIo.on('connect', (socket) => {
		socketIo.emit('recieveMessage', messageArray)
		// });

	} catch (error) {
		console.log(`An error occured while sending a message: ${error}`);
		let errorMessage = await encodeURIComponent('An error occured while sending a message');
		// TODO
		// return res.redirect(`/?error=${error}`);
	}
}

// Routes

// GET index route
// Gets the last n messages from the database and renders the index page
router.get('/', async (req, res) => {
	try {
		let messageArray = await getMessageArray();

		// Getting error message
		let error = await req.query.error;
	
		socketIo.emit('recieveMessage', messageArray)

		res.render('index', {error : error});
	
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
			`SELECT messages.message, messages.isOffensive, users.username, users.isBanned
			FROM messages
			JOIN users ON messages.author = users.id
			ORDER BY time DESC
			LIMIT ?
			`,
			[parseInt(process.env.GET_MESSAGE_LIMIT)],
			true
		);
	
		// Reverse the array
		// messageArray.reverse();
	
		return messageArray;
	} catch (error) {
		throw new Error(`An error occured while getting the message array: ${error}`);
	}
}

// Export the router
module.exports = router;
