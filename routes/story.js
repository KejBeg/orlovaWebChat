// Imports
const express = require('express');
const router = express.Router();

// Import database
const connection = require('../database');

// Routes
router.get('/', (req, res) => {
	res.render('story');
});

router.post('/', (req, res) => {
	let answerID = req.body.answerID;

    connection.query(
        `UPDATE users SET storyQuestion = ? WHERE id = ?`,
		[answerID, 1], //TODO: --- user ID = 1 is a placeholder; redo when its possible to get user ID from client
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