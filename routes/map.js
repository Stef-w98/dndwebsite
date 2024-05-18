const express = require('express');
const router = express.Router();

// Example map data endpoint
router.get('/map-data', (req, res) => {
    const mapData = {
        // Add your map data here
        regions: [
            { name: 'Region1', coordinates: [10, 20] },
            { name: 'Region2', coordinates: [30, 40] }
        ]
    };
    res.json(mapData);
});

module.exports = router;
