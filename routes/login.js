// Imports
const express = require('express');
const router = express.Router();

// Import database
const database = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;

// Routes

// Login route
router.get('/', async (req, res) => {
	res.render('login/login');
});

router.post('/', async (req, res) => {
	const username = await req.body.username;
	const password = await req.body.password;
	let databasePassword;

	// Getting password from database
	await sendSqlQuery(
		'SELECT password FROM users WHERE username = ?',
		[username],
		true
	)
		.then((result) => {
			if (result == '') {
				console.log(`User ${username} does not exist`);
				res.redirect('/login');
			}

			databasePassword = result[0].password;
			console.log('Password from database: ' + databasePassword);
		})
		.catch((error) => {
			console.log(`An error occured while logging in: ${error}`);
			res.redirect('/login');
		});

	// Checking if password is correct
	if (password == databasePassword) {
		console.log(`User ${username} logged in successfully`);
		res.cookie('username', username);
		return res.redirect('/');
	}
	return res.redirect('/login');
});

// Register route
router.get('/register', async (req, res) => {
	res.render('login/register');
});

router.post('/register', async (req, res) => {
	const username = await req.body.username;
	const password = await req.body.password;

	let userExists;

	// Checking if the user exists
	await sendSqlQuery('SELECT * FROM users WHERE username = ?', [username], true)
		.then((result) => {
			console.log(result);
			if (result != '') {
				userExists = true;
			} else {
				userExists = false;
			}
		})
		.catch((err) => {
			return res.redirect('/login');
		});

	// If the user exists, redirect to login
	if (userExists) {
		console.log(`User ${username} already exists`);
		return res.redirect('/login');
	}

	// Creating the user
	await sendSqlQuery('INSERT INTO users (username, password) VALUES (?,?)', [
		username,
		password,
	])
		.then(() => {
			console.log(`User ${username} created successfully`);
			res.cookie('username', username);
			return res.redirect('/');
		})
		.catch((err) => {
			console.log(`An error occured while creating a user: ${err}`);
			return res.redirect('/login');
		});
});

// Logout route
router.get('/logout', async (req, res) => {
	res.clearCookie('username');
	res.redirect('/');
});

// Export the router
module.exports = router;
