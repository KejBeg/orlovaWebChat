// Imports
const express = require('express');
const router = express.Router();

// Import database
const database = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;
const crypto = require('crypto'); // Used for token generation

// Routes

// GET login route
// Renders the login page
router.get('/login', async (req, res) => {
	res.render('user/login');
});

// POST login route
// Gets username and password from POST request and checks if they are correct
// If they are correct, token is set and user is redirected to index
router.post('/login', async (req, res) => {
	try {
		const username = await req.body.username;
		const password = await req.body.password;

		let databasePassword = await sendSqlQuery(
			'SELECT password FROM users WHERE username = ?',
			[username],
			true
		);
		databasePassword = databasePassword[0].password;

		// Checking if user exists
		if (!userExists(username)) {
			console.log(`User ${username} does not exist`);
			return res.redirect('/user/login');
		}

		// Checking if password is correct
		if (password != databasePassword) {
			console.log(`User ${username} entered the wrong password`);
			return res.redirect('/user/login');
		}

		// Getting the user's token
		let token = await sendSqlQuery(
			'SELECT token FROM users WHERE username = ?',
			[username],
			true
		);
		token = token[0].token;

		// Checking if password is correct
		console.log(`User ${username} logged in successfully`);
		res.cookie('userToken', token);

		return res.redirect('/');
	} catch (error) {
		console.log(`An error occured while logging in: ${error}`);
		return res.redirect('/user/login');
	}
});

// GET register route
router.get('/register', async (req, res) => {
	res.render('user/register');
});

// POST register route
// Gets username and password from POST request and creates a user, if the username isn't taken
// Sets token and redirects to index
router.post('/register', async (req, res) => {
	try {
		const username = await req.body.username;
		const password = await req.body.password;

		// If the user exists, redirect to login
		if (await userExists(username)) {
			console.log(`User ${username} already exists`);
			return res.redirect('/login');
		}

		// Generating token
		let token = await generateUserToken();

		// Checking if token is already taken
		while ((await verifyUserToken(token)) == true) {
			token = await generateUserToken();
		}

		// Creating the user
		await sendSqlQuery(
			'INSERT INTO users (username, password, token) VALUES (?, ?, ?)',
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

// GET logout route
// Clears the user token and redirects to index
router.get('/logout', async (req, res) => {
	res.clearCookie('userToken');
	res.redirect('/');
});

/**
 * Checks if a user exists
 * @param {string} username
 * @returns True if the user exists, false if it does not
 */
async function userExists(username) {
	let result = await sendSqlQuery(
		'SELECT * FROM users WHERE username = ?',
		[username],
		true
	);

	if (result == undefined || result == '') {
		return false;
	} else {
		return true;
	}
}

/**
 * Function that generates a token
 * @returns a token
 */
async function generateUserToken() {
	let token = crypto
		.randomBytes(parseInt(process.env.TOKEN_BITS))
		.toString('hex');
	console.log('Token successfully generated');
	return token;
}

/**
 * Function that verifies if a token is already taken or not
 * @param {*} token Needed to check if the token is already taken or not
 * @returns True if the token is already taken, false if it is not
 */
async function verifyUserToken(token) {
	try {
		// Getting all tokens from database
		let allTokens = await sendSqlQuery('SELECT token FROM users', [], true);

		// If there are no tokens in the database, return false
		if (allTokens == undefined) {
			return false;
		}

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
