// Imports
const express = require('express');
const router = express.Router();

// Import database
const database = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;
const crypto = require('crypto'); // Used for token generation
const { log } = require('console');

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
		if (!userExistsByName(username)) {
			console.log(`User ${username} does not exist`);
			return res.redirect('/user/login');
		}

		// Checking if password is correct
		if (!(await verifyPassword(databasePassword, password))) {
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
		if (await userExistsByName(username)) {
			console.log(`User ${username} already exists`);
			return res.redirect('/login');
		}

		// Checking if password is valid
		if (!(await isPasswordValid(password))) {
			console.log(`${username} entered an invalid password`);
			return res.redirect('/user/register');
		}

		// Getting a new token
		const token = await getNewToken();

		// Hash the password
		const hashedPassword = await encryptPassword(password);
		3000;
		// Creating the user
		await sendSqlQuery(
			'INSERT INTO users (username, password, token) VALUES (?, ?, ?)',
			[username, hashedPassword, token]
		);

		console.log(`User ${username} created successfully`);
		res.cookie('userToken', token);
		return res.redirect('/');
	} catch (error) {
		console.log(`An error occured while creating a user: ${error}`);
		return res.redirect('/user/register');
	}
});

// GET logout route
// Logs the user out and redirects to index
// If not Anonymous, change token
router.get('/logout', async (req, res) => {
	let currentToken = await req.cookies.userToken;
	let userExists = await userExistsByToken(currentToken);

	// If user exists, change token
	if (userExists && currentToken != 'Anonymous') {
		// Gets username
		let username = await sendSqlQuery(
			'SELECT username FROM users WHERE token = ?',
			[currentToken],
			true
		);

		// Generates new token
		let newToken = await getNewToken();

		// Changes token
		await sendSqlQuery('UPDATE users SET token = ? WHERE token = ?', [
			newToken,
			currentToken,
		]);
	}

	res.clearCookie('userToken');
	res.redirect('/');
});

// GET user list route
// Gets all users from the database and renders the user list page
router.get('/list', async (req, res) => {
	try {
		// Get all users
		let users = await sendSqlQuery('SELECT * FROM users', [], true);

		res.render('user/list', { users: users });
	} catch (error) {
		console.log(`An error happened while getting the user list: ${error}`);
		return res.redirect('/');
	}
});

// GET user profile route
// Gets the user's profile and renders the profile page
router.get('/list/:id', async (req, res) => {
	try {
		// Get user's token
		let wantedId = req.params.id;

		// Check if user exists by id
		if (!(await userExistsById(wantedId))) {
			console.log(`Id ${wantedId} does not exist`);
			return res.redirect('/');
		}

		// Get user's data
		let user = await sendSqlQuery(
			'SELECT * FROM users WHERE id =?',
			[wantedId],
			true
		);

		let userMessages = await sendSqlQuery(
			'SELECT * FROM messages WHERE author = ?',
			[user[0].id],
			true
		);

		let messageCount = userMessages.length;

		let accountAge = await sendSqlQuery(
			'SELECT DATEDIFF(CURDATE(),?) AS accountAgeDays',
			[user[0].userCreationDate],
			true
		);

		let avarageMessagesPerDay =
			messageCount / (accountAge[0].accountAgeDays + 1);

		let longestMessage = await sendSqlQuery(
			'SELECT message FROM messages WHERE author = "?" ORDER BY LENGTH(message) DESC LIMIT 1;',
			[user[0].id],
			true
		);

		let totalMsgLength = 0;
		userMessages.forEach((element) => {
			totalMsgLength += element.message.length;
		});
		let avarageMessageLength = totalMsgLength / messageCount;

		res.render('user/profile', {
			user: user[0],
			creationDate: rephraseMySQLDate(user[0].userCreationDate),
			lastActiveDate: rephraseMySQLDate(user[0].lastActiveDate, true),
			msgPerDay: avarageMessagesPerDay,
			messageCount: messageCount,
			longestMessage: longestMessage[0].message,
			avarageMsgLength: avarageMessageLength,
			isUserBanned: user[0].isBanned,
		});
	} catch (error) {
		console.log(
			`An error happened during rendering the profile page: ${error}`
		);
		return res.redirect('/');
	}
});

// GET user edit route
// Renders the edit page
router.get('/edit', async (req, res) => {
	try {
		// Get user's token
		let currentToken = await req.cookies.userToken;

		// Check if user exists by token
		if (!(await userExistsByToken(currentToken))) {
			console.log(`Token ${currentToken} does not exist`);
			return res.redirect('/');
		}

		// Anonymous can't edit a profile
		if (currentToken == 'Anonymous') {
			console.log('Anonymous tried to edit a profile');
			return res.redirect('/');
		}

		// Render the edit page
		return res.render('user/edit');
	} catch (error) {
		console.log(`An error happened during rendering the edit page: ${error}`);
		return res.redirect('/');
	}
});

// POST user edit route
// Gets the new username from POST request and changes them
router.post('/edit', async (req, res) => {
	try {
		// Get user's token
		let currentToken = await req.cookies.userToken;

		// Check if user exists by token
		if (!(await userExistsByToken(currentToken))) {
			console.log(`Token ${currentToken} does not exist`);
			return res.redirect('/');
		}

		// Anonymous can't edit a profile
		if (currentToken == 'Anonymous') {
			console.log('Anonymous tried to edit a profile');
			return res.redirect('/');
		}

		// Get new username
		let newUsername = await req.body.username;

		// Can't have more users with the same username
		if (await userExistsByName(newUsername)) {
			console.log('Username already exists');
			return res.redirect('/');
		}

		// Change username
		sendSqlQuery('UPDATE users SET username = ? WHERE token = ?', [
			newUsername,
			currentToken,
		]);

		res.redirect('/');
	} catch (error) {
		console.log(`An error happened during editing a user: ${error}`);
		return res.redirect('/');
	}
});

/**
 * Rephrases mySQL Date string to a different, more human readable format
 * @param {string} mySQLDate
 * @param {boolean} includeSeconds
 * @returns modified mySQL Date
 */
function rephraseMySQLDate(mySQLDate, includeTime = false) {
	let [y, M, d, h, m, s] = mySQLDate.match(/\d+/g);

	if (includeTime) return d + '.' + M + ' ' + y + ' - ' + h + ':' + m + ':' + s;
	return d + '.' + M + ' ' + y;
}

function mySQLDateToJSON(mySQLDate) {
	let [y, M, d, h, m, s] = mySQLDate.match(/\d+/g);

	return {
		year: y,
		month: M,
		day: d,
		hour: h,
		minute: m,
		second: s,
	};
}

/**
 * Checks if a user exists
 * @param {string} username
 * @returns True if the user exists, false if it does not
 */
async function userExistsByName(username) {
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
 * Gets if user exists by token
 * @param {string} token Token for which to scan
 * @returns
 */
async function userExistsByToken(token) {
	let result = await sendSqlQuery(
		'SELECT * FROM users WHERE token = ?',
		[token],
		true
	);

	if (result == undefined || result == '') {
		return false;
	} else {
		return true;
	}
}

/**
 * Gets if a user exists by checking ID
 * @param {int} wantedId
 * @returns {boolean}
 */
async function userExistsById(wantedId) {
	try {
		// Getting user data
		let result = await sendSqlQuery(
			'SELECT * FROM users WHERE id = ?',
			[wantedId],
			true
		);

		if (result == undefined || result == '') {
			return false;
		} else {
			return true;
		}
	} catch (error) {
		console.log(
			`An error occured while checking if a user exists by id: ${error}`
		);
		throw error;
	}
}

/**
 * Gets a new token and verifies if it is already taken or not
 * @returns a unique token
 */
async function getNewToken() {
	// Generating token
	let token = await generateUserToken();

	// Checking if token is already taken
	while ((await verifyUserToken(token)) == true) {
		token = await generateUserToken();
	}

	console.log('Created new token successfully');
	return token;
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

/**
 * Encrypts/hashes a password
 * @param {string} password
 * @returns {string} An encrypted password
 */
async function encryptPassword(password) {
	try {
		// Generating salt
		const passwordSalt = await crypto
			.randomBytes(parseInt(process.env.PASSWORD_SALT_BITS))
			.toString('hex');

		// Generating password hash
		const passwordHash = await crypto
			.pbkdf2Sync(
				password,
				passwordSalt,
				parseInt(process.env.PASSWORD_ITERATION_LIMIT),
				parseInt(process.env.PASSWORD_KEY_LENGTH),
				process.env.PASSWORD_ENCRYPTION_ALGORITHM
			)
			.toString('hex');

		// Return the encrypted password
		return `${passwordHash}.${passwordSalt}`;
	} catch (error) {
		console.log(`An error occured while encrypting a password: ${error}`);
		throw error;
	}
}

/**
 * Verifies if a password is correct
 * @param {string} databasePassword
 * @param {string} loginPassword
 * @returns {boolean} If passwords match, returns true, if they don't, returns false
 */
async function verifyPassword(databasePassword, loginPassword) {
	try {
		// Split the password hash and salt
		const [passwordHash, passwordSalt] = databasePassword.split('.');

		const hashedPasswordBuf = Buffer.from(passwordHash, 'hex');
		const suppliedPasswordBuf = await crypto.pbkdf2Sync(
			loginPassword,
			passwordSalt,
			parseInt(process.env.PASSWORD_ITERATION_LIMIT),
			parseInt(process.env.PASSWORD_KEY_LENGTH),
			process.env.PASSWORD_ENCRYPTION_ALGORITHM
		);

		// Return true if passwords match, false if they don't
		return crypto.timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
	} catch (error) {
		console.log(`An error occured while verifying a password: ${error}`);
		throw error;
	}
}

/**
 * Checks if a password meets the requirements
 * @param {string} password
 * @returns {boolean}
 */
async function isPasswordValid(password) {
	// Checking the length of password
	if (password.length < parseInt(process.env.PASSWORD_MIN_LENGTH)) {
		return false;
	}

	return true;
}

// Export the router
module.exports = router;
