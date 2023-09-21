// Imports
const express = require('express');
const router = express.Router();

// Import database
const database = require('../database');

// Routes
router.get('/', (req, res) => {
	res.render('login');
});

router.post('/', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
});
