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

// Setting up the app
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('layout', 'layouts/layout');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));
app.use(cookieParser());

// Setting token to Anonymous
app.use((req, res, next) => {
	if (!req.cookies.userToken) {
		res.cookie('userToken', 'Anonymous');
	}
	next();
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
app.listen(process.env.PORT || 3000);
