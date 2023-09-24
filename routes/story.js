// Imports
const express = require('express');
const router = express.Router();

// Import database
const connection = require('../database').connection;

// Routes
router.get('/', async (req, res) => {
	let questionObj = await getQuestion(1); //TODO: --- placeholder 1; redo with user ID
	res.render('story', {
		q: questionObj.question,
		a1: questionObj.answers[0],
		a2: questionObj.answers[1],
		a3: questionObj.answers[2],
	});
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

async function getQuestion(userID) {
	let question;
	let questionID;

	//Gets current questionID from user
	questionID = await new Promise(function (resolve, reject) {
		connection.query(
			`SELECT storyQuestion FROM users WHERE id = ?`,
			userID,
			(error, result) => {
				if (error) {
					console.log(`An error occured while accesing the message ${error}`);
					return reject(error);
				}
				questionID = result[0]['storyQuestion'];
				resolve(questionID);
			}
		);
	});

	//Gets current question string using questionID
	questionArray = await new Promise(function (resolve, reject) {
		connection.query(
			`SELECT * FROM storyMessages WHERE id = ?`,
			questionID,
			(error, result) => {
				if (error) {
					console.log(`An error occured while accesing the message ${error}`);
					return reject(error);
				}

				question = result[0]['question'];
				answers = [
					result[0]['answer1Id'],
					result[0]['answer2Id'],
					result[0]['answer3Id'],
				];
				resolve([question, answers]);
			}
		);
	});

	question = questionArray.shift();
	answersID = questionArray[0]; //the .shift fucks it up somehow so [0] is needed

	//gets Answers to the question using answersID
	answers = await new Promise(function (resolve, reject) {
		connection.query(
			`SELECT answer FROM storyMessages WHERE id = ? OR id = ? OR id = ?`,
			answersID,
			(error, result) => {
				if (error) {
					console.log(`An error occured while accesing the message ${error}`);
					return reject(error);
				}
				answers = [
					result[0]['answer'],
					result[1]['answer'],
					result[2]['answer'],
				];
				resolve(answers);
			}
		);
	});

	return { question, answers };
}
// Export the router
module.exports = router;
