const express = require('express');
const router = express.Router();

// Endpoint to fetch test data
router.get('/data', (req, res) => {
    res.json({ message: 'Hello, world!' });
});

module.exports = router;
