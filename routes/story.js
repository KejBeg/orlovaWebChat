// Imports
const express = require('express');
const router = express.Router();

// Import database
const connection = require('../database');

// Routes
router.get('/', (req, res) => {
	let question = getQuestion(1); //TODO: --- placeholder 1; redo with user ID
	console.log(question + " question FINAL ------");
	res.render('story', {q:question});
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

function getQuestion(userID){
	let questionID = 0;
	let question = 0;

	//Gets current questionID from user
	connection.query(`SELECT storyQuestion FROM users WHERE id = ?`, userID, (error, result) => {
		if (error) {
			console.log(`An error occured while inserting the message ${error}`);
		}
		console.log(result[0]["storyQuestion"] + " question");
		questionID = result[0]["storyQuestion"];

	});
	
	//Gets current question string using questionID
	connection.query(`SELECT question FROM storyMessages WHERE id = ?`, questionID, (error, result) => {
		console.log(questionID + " questionID");
		if (error) {
			console.log(`An error occured while inserting the message ${error}`);
		}
		console.log(result[0] + " <- Result ____________________________________");
		question = result[0]["question"];
	});

	console.log(question + " <- Question ____________________________________");
	return question;
}
// Export the router
module.exports = router;