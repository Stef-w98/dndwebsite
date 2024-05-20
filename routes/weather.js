const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.get('/weather-conditions', async (req, res) => {
    try {
        console.log('Fetching weather conditions...');
        const { data: weatherConditions, error } = await supabase
            .from('weatherconditions')
            .select('name, mintemp, maxtemp, description');

        if (error) throw error;

        console.log('Weather conditions fetched:', weatherConditions);
        res.json(weatherConditions);
    } catch (error) {
        console.error('Error fetching weather conditions:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/weather-markers', async (req, res) => {
    try {
        console.log('Fetching weather markers...');
        const { data: weatherMarkers, error } = await supabase
            .from('weathermarkers')
            .select('markerid, zoneid, latitude, longitude, locationdescription, climatezones:climatezones(name)');

        if (error) throw error;

        console.log('Weather markers fetched:', weatherMarkers);
        res.json(weatherMarkers);
    } catch (error) {
        console.error('Error fetching weather markers:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;