// Imports
const express = require('express');
const router = express.Router();

// Import database
const connection = require('../database').connection;
const sendSqlQuery = require('../database').sendSqlQuery;

// Routes
router.get('/', async (req, res) => {
	try {
		// Getting error message
		let error = await req.query.error;

		// Anonymous users cannot access the story page
		if (await req.cookies.userToken == 'Anonymous') {
			console.log('Anonymous user tried to access story page');
			let errorMessage = await encodeURIComponent('You must be logged in to access the story page');
			return res.redirect(`/user/login?error=${errorMessage}`);
		}

		let questionObj = await getQuestion(req.cookies.userToken);
		res.render('story', {
			q: questionObj.question,
			a: answers,
			error : error
		});

		//records activity in database
		sendSqlQuery(
			'UPDATE users SET lastActiveDate = CURRENT_TIMESTAMP WHERE token = ?',
			[req.cookies.userToken]
		);
	} catch (error) {
		console.log(`An error occured while loading the story page: ${error}`);
		let errorMessage = await encodeURIComponent('An error occured while loading the story page');
		return res.redirect(`/?error=${errorMessage}`);
	}
});

router.post('/', async (req, res) => {
	try {
		let answerID = req.body.answerID;

		await sendSqlQuery(`UPDATE users SET storyQuestion = ? WHERE token = ?`, [
		answerID,
		req.cookies.userToken,
		]);

		res.redirect('/story');
	}	catch (error){
		console.log(`An error occured while proccesing the story page POST request: ${error}`);
		let errorMessage = await encodeURIComponent('An error occured while proccesing the story page POST request');
		return res.redirect(`/story/?error=${errorMessage}`);
	}

});

async function getQuestion(userToken) {
	try {
		//Gets current question string using userToken
		questionArray = await sendSqlQuery(
			`SELECT * FROM storyMessages WHERE id = (SELECT storyQuestion FROM users WHERE token = ?);`,
			[userToken],
			true
		);

		question = questionArray[0]['question'];
		answers = {
			answerId1: questionArray[0]['answer1Id'],
			answerId2: questionArray[0]['answer2Id'],
			answerId3: questionArray[0]['answer3Id'],

			answer1: questionArray[0]['answer1'],
			answer2: questionArray[0]['answer2'],
			answer3: questionArray[0]['answer3']
		};

		return { question, answers };
	} catch (error) {
		console.log(`An error occured while getting the story question: ${error}`);
		throw new Error('An error occured while getting the story question');
	}
}

// Export the router
module.exports = router;
