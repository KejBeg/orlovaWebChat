// Imports
const express = require('express');
const router = express.Router();

// Import database
const connection = require('../database');

// Routes
router.get('/', (req, res) => {
	res.render('index');
});

router.post('/', (req, res) => {
	let message = req.body.message;
	connection.query(
		`INSERT INTO messages (message) VALUES ('${message}')`,
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

// Export the router
module.exports = router;
