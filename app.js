// Check if environment is development
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

// Imports
const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Database
const dbConnection = require('./database');

const connection = require('./database').connection;
const sendSqlQuery = require('./database').sendSqlQuery;

// Setting up the app
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('layout', 'layouts/layout');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));
app.use(cookieParser());


app.use(async (req, res, next) => {
	try{
		let userToken = await req.cookies.userToken;

		// Setting user token to Anonymous if it doesn't exist or if user has invalid token
		if (userToken == undefined || userToken == null || !userExistsByToken(userToken)) {
			res.cookie('userToken', 'Anonymous');
		}

		//sets theme
		if (userToken != 'Anonymous'){

			//for logged in users select their theme
			userTheme = await sendSqlQuery(
			'SELECT theme FROM users WHERE token = ?',
			[userToken],
			true
			);
			
			if(userTheme != "") userTheme = userTheme[0].theme;
			else userToken = 'Anonymous';
		}
		//select a random theme for anonymous and people that have it selected
		if(userToken == 'Anonymous' || userTheme == 'random'){
			userTheme = selectRandomTheme();
		}
		
		app.locals.theme = "/stylesheets/style-" + userTheme + ".css";
		next();
	}catch(err){
		console.log(`An error occured while loading user themes: ${err}`);
		let errorMessage = await encodeURIComponent('An error occured while loading user themes');
		return res.redirect(`/?error=${errorMessage}`);
	}

});

function selectRandomTheme(){
	randomInt = Math.floor(Math.random() * 5)
	switch(randomInt){
		case 0:
			userTheme = "autumn";
			break;
		case 1:
			userTheme = "jungle";
			break;
		case 2:
			userTheme = "night";
			break;
		case 3:
			userTheme = "snowflakes";
			break;
		case 4:
			userTheme = "tribal";
			break;
		default:
			userTheme = "autumn";
			break;
	}
	return userTheme;
}

//chtěl jsem to importnout přes user.js ale když jsem to udělal stejně jako to je v database.js se sendSqlQuery tak to nejelo tak na to kašlu
/**
 * Gets if user exists by token
 * @param {string} token Token for which to scan
 * @returns
 */
async function userExistsByToken(token) {
	try {
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
	} catch (error) {
		throw new Error(`An error occured while checking if a user exists by token: ${error}`);
	}
}

// Routers
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const storyRouter = require('./routes/story');

// Using the routers
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/story', storyRouter);


// Listening to the port
app.listen(process.env.PORT, () => {
	console.log(`Listening to port ${process.env.PORT}`);
});

