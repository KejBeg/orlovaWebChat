// Imports
const express = require('express');
const router = express.Router();

// Import database
const connection = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;

// Routes
router.get('/', async (req, res) => {

	if(req.cookies.userToken == 'Anonymous') {
		return res.redirect('/user/login');
	}

	let questionObj = await getQuestion(req.cookies.userToken);
	res.render('story', {
		q : questionObj.question,
		a : answers
	});

	//records activity in database
	sendSqlQuery(
		'UPDATE users SET lastActiveDate = CURRENT_TIMESTAMP WHERE token = ?',
		[req.cookies.userToken]
	);
});

router.post('/', (req, res) => {
	let answerID = req.body.answerID;


	try{
		sendSqlQuery(`UPDATE users SET storyQuestion = ? WHERE token = ?`, [
		answerID,
		req.cookies.userToken,
	]);}
	catch (err){
		console.log(`An error happened while setting user question: ${err}`);
		return res.redirect('/');
	}

	res.redirect('/story');
});

async function getQuestion(userToken) {
	//Gets current question string using userToken
	questionArray = await sendSqlQuery(
		`SELECT * FROM storyMessages WHERE id = (SELECT storyQuestion FROM users WHERE token = ?);`,
		[userToken],
		true
	);

	question = questionArray[0]['question'];
	answers = {
		answerId1 : questionArray[0]['answer1Id'],
		answerId2 :  questionArray[0]['answer2Id'],
		answerId3 :  questionArray[0]['answer3Id'],

		answer1 : questionArray[0]['answer1'],
		answer2 : questionArray[0]['answer2'],
		answer3 : questionArray[0]['answer3']
	};

	return { question, answers };
}
// Export the router
module.exports = router;
