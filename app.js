// Check if environment is development
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

// Imports
const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');

// Import database
const mongoose = require('mongoose');

// Database connection
mongoose.connect(process.env.DATABASE_URL, {
	useNewUrlParser: true,
});

const db = mongoose.connection;

db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Mongoose'));

// Setting up the app
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('layout', 'layouts/layout');
app.use(expressLayouts);
app.use(express.static('public'));

// Routers
const indexRouter = require('./routes/index');

// Using the routers
app.use('/', indexRouter);

// Listening to the port
app.listen(process.env.PORT || 3000);
