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

		// Setting user token to Anonymous if it doesn't exist
		if (userToken == undefined || userToken == null) {
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
			console.log(`User theme: ${userTheme[0].theme}`);

			userTheme = userTheme[0].theme;

		} else {
			//for anonymous select a random theme
			if(userToken == 'Anonymous'){
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
			}
		}

		// Setting theme to app.locals so it can be used in ejs files
		app.locals.theme = "/stylesheets/style-" + userTheme + ".css";
		next();
	}catch(error){
		console.log(`An error occured while loading user themes: ${error}`);
		let errorMessage = await encodeURIComponent('An error occured while loading user themes');
		res.redirect(`/?error=${errorMessage}`);
	}
	
});

// Routers
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const storyRouter = require('./routes/story');

// Using the routers
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/story', storyRouter);

// Listening to the port
app.listen(process.env.WEB_PORT, () => {
	console.log(`Listening to port ${process.env.WEB_PORT}`);
});
