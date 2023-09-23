// Imports
const express = require('express');
const router = express.Router();

// Import database
const connection = require('../database');

// Routes
router.get('/', async (req, res) => {
	let question = await getQuestion(1); //TODO: --- placeholder 1; redo with user ID
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
    res.redirect('/story');
});

async function getQuestion(userID){
	let question;
	let questionID;

	
	//Gets current questionID from user
	questionID = await new Promise(function(resolve,reject){
		connection.query(`SELECT storyQuestion FROM users WHERE id = ?`, userID, (error, result) => {
			if (error) {
				console.log(`An error occured while accesing the message ${error}`);
				return reject(error);
			}
			questionID = result[0]["storyQuestion"];
			resolve(questionID);
		});
	});

	//Gets current question string using questionID
	question = await new Promise(function(resolve,reject){
		connection.query(`SELECT question FROM storyMessages WHERE id = ?`, questionID, (error, result) => {
			if (error) {
				console.log(`An error occured while accesing the message ${error}`);
				return reject(error);
			}
			question = result[0]["question"];
			resolve(question);
		});
	});
	return question;
}
// Export the router
module.exports = router;