// Imports
const express = require('express');
const router = express.Router();

// Import database
const connection = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;

// Routes
router.get('/', async (req, res) => {
	let questionObj = await getQuestion(req.cookies.userToken);
	res.render('story', {
		q: questionObj.question,
		a1: questionObj.answers[0],
		a2: questionObj.answers[1],
		a3: questionObj.answers[2],
	});
});

router.post('/', (req, res) => {
	let answerID = req.body.answerID;

	sendSqlQuery(
		`UPDATE users SET storyQuestion = ? WHERE token = ?`,
		[answerID, req.cookies.userToken],
	);
	res.redirect('/story');
});

async function getQuestion(userToken) {
	//Gets current question string using userToken
	questionArray = await sendSqlQuery(
			`SELECT * FROM storyMessages WHERE id = (SELECT storyQuestion FROM users WHERE token = ?);`,
			[userToken],
			true
		);
	console.log(JSON.stringify(questionArray));
	question = questionArray[0]['question'];
	answersID = [
		questionArray[0]['answer1Id'],
		questionArray[0]['answer2Id'],
		questionArray[0]['answer3Id'],
	];

	//gets Answers to the question using answersID
	answersResult = await sendSqlQuery(
			`SELECT * FROM storyMessages WHERE id = ? OR id = ? OR id = ?`,
			answersID,
<<<<<<< HEAD
			(error, result) => {
				if (error) {
					console.log(`An error occured while accesing the message ${error}`);
					return reject(error);
				}
				answers = [result[0], result[1], result[2]];
				resolve(answers);
			}
=======
			true
>>>>>>> 78b09ebeca3b00837dfda78c86035687765f8cd6
		);

	answers = [
		answersResult[0],
		answersResult[1],
		answersResult[2],
	];

	return { question, answers };
}
// Export the router
module.exports = router;
