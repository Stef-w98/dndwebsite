// api/register.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhgspooltizwismypzan.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZ3Nwb29sdGl6d2lzbXlwemFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA2MTI2MDQsImV4cCI6MjAyNjE4ODYwNH0.7uPvzyXlBh6EUShss-I2KkuAAPdyeMauKXdKwGl6YnA' // Use environment variables
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async (req, res) => {
    // Ensure the CORS headers are set for every response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { email, password } = req.body;

        const { user, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(200).json({ user });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};
