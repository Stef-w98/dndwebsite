const express = require('express');
const router = express.Router();

// Example endpoint for fetching data
router.get('/data', (req, res) => {
    res.json({ message: 'Hello, world!' });
});

module.exports = router;
