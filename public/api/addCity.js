const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhgspooltizwismypzan.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZ3Nwb29sdGl6d2lzbXlwemFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA2MTI2MDQsImV4cCI6MjAyNjE4ODYwNH0.7uPvzyXlBh6EUShss-I2KkuAAPdyeMauKXdKwGl6YnA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        // Ensure req.body is parsed as JSON -- Vercel should do this automatically
        // Destructure all expected fields from req.body
        const {
            name,
            description,
            latitude,
            longitude,
            npc,
            history,
            culture,
            economy,
            politics,
            religion,
            climate,
            points_of_interest,
            populations
        } = req.body;

        console.log("Received data:", req.body); // Debug: Log received data

        // Pass the destructured fields directly into the insert method
        const { data, error } = await supabase
            .from('cities')
            .insert([{
                name,
                description,
                latitude,
                longitude,
                npc,
                history,
                culture,
                economy,
                politics,
                religion,
                climate,
                points_of_interest,
                populations
            }]);

        if (error) {
            console.error('Error adding city:', error);
            return res.status(500).json({ error: 'Failed to add city', details: error.message });
        }

        res.status(201).json(data);
    } else {
        // Respond with method not allowed for non-POST requests
        res.status(405).end();
    }

};
