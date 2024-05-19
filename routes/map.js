const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Fetch all map data
router.get('/map-data', async (req, res) => {
    try {
        const { data: cities, error: citiesError } = await supabase.from('cities').select('*');
        if (citiesError) throw citiesError;

        const { data: regions, error: regionsError } = await supabase.from('regions').select('*');
        if (regionsError) throw regionsError;

        const { data: coordinates, error: coordinatesError } = await supabase.from('coordinates').select('*');
        if (coordinatesError) throw coordinatesError;

        const { data: weatherMarkers, error: weatherMarkersError } = await supabase.from('weathermarkers').select('*');
        if (weatherMarkersError) throw weatherMarkersError;

        res.json({ cities, regions, coordinates, weatherMarkers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a city
router.post('/addCity', async (req, res) => {
    try {
        const cityData = req.body;
        const { error } = await supabase.from('cities').insert(cityData);

        if (error) throw error;

        res.status(200).json({ message: 'City added successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
