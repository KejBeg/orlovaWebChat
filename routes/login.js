// Imports
const express = require('express');
const router = express.Router();

// Import database
const database = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;
const crypto = require('crypto'); // Used for token generation
const { all } = require('.');

// Routes

// Login route
router.get('/', async (req, res) => {
	res.render('login/login');
});

router.post('/', async (req, res) => {
	try {
	} catch (error) {}

	const username = await req.body.username;
	const password = await req.body.password;

	let databasePassword = await sendSqlQuery(
		'SELECT password FROM users WHERE username = ?',
		[username],
		true
	);

	// Getting the user's token
	let token = await sendSqlQuery(
		'SELECT token FROM users WHERE username = ?',
		[username],
		true
	);

	// Getting password from database
	if (databasePassword == '') {
		console.log(`User ${username} does not exist`);
		return res.redirect('/login');
	}

	// Checking if password is correct
	if (password == databasePassword) {
		console.log(`User ${username} logged in successfully`);
		res.cookie('userToken', token);
		return res.redirect('/');
	}
	return res.redirect('/login');
});

// Register route
router.get('/register', async (req, res) => {
	res.render('login/register');
});

/**
 * Function that checks if a user exists
 * @param {string} username
 * @returns True if the user exists, false if it does not
 */
async function userExists(username) {
	let result = await sendSqlQuery(
		'SELECT * FROM users WHERE username = ?',
		[username],
		true
	);

	if (result != '') {
		return true;
	} else {
		return false;
	}
}

router.post('/register', async (req, res) => {
	try {
		const username = await req.body.username;
		const password = await req.body.password;

		// If the user exists, redirect to login
		if (userExists(username)) {
			console.log(`User ${username} already exists`);
			return res.redirect('/login');
		}

		// Generating token
		let token = await generateUserToken();

		// Checking if token is already taken
		while (tokenExists(token)) {
			token = await generateUserToken();
		}

		// Creating the user
		await sendSqlQuery(
			'INSERT INTO users (username, password, token) VALUES (?,?, ?)',
			[username, password, token]
		);

		console.log(`User ${username} created successfully`);
		res.cookie('userToken', token);
		return res.redirect('/');
	} catch (error) {
		console.log(`An error occured while creating a user: ${error}`);
		return res.redirect('/register');
	}
});

// Logout route
router.get('/logout', async (req, res) => {
	res.clearCookie('usrToken');
	res.redirect('/');
});

/**
 * Function that generates a token
 * @returns a token
 */
async function generateUserToken() {
	crypto.randomBytes(parseInt(process.env.TOKEN_BITS), (error, buffer) => {
		// Error handling
		if (error) {
			throw error;
		}

		console.log('Token generated successfully');

		// Generating token
		let token = buffer.toString('hex');
		return token;
	});
}

/**
 * Function that verifies if a token is already taken or not
 * @param {*} token Needed to check if the token is already taken or not
 * @returns True if the token is already taken, false if it is not
 */
async function verifyUserToken(token) {
	try {
		// Getting all tokens from database
		let allTokens = await sendSqlQuery('SELECT token FROM tokens', [], true);

		// If token is found in database, return true
		for (oneToken in allTokens) {
			if (oneToken == token) {
				return true;
			}
		}

		// If token is not found in database, return false
		return false;
	} catch (error) {
		console.log(`An error occured while verifying a token: ${error}`);
		throw error;
	}
}

// Export the router
module.exports = router;
