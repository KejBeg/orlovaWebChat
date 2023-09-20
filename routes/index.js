// Imports
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
	res.render('index');
});

// Export the router
module.exports = router;
