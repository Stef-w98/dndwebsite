require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cacheControl = require('express-cache-controller');
const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Use sessions
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

// Use cache control
app.use(cacheControl({
    noCache: false,
    private: false,
    mustRevalidate: true
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const mapRoutes = require('./routes/map');

// Use routes
app.use('/api', authRoutes);
app.use('/api', dataRoutes);
app.use('/api', mapRoutes);

console.log('Routes setup complete');

// Start the server
const PORT = 80; // Use port 80 for public access
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle shutdown signals
const shutdown = () => {
    server.close(() => {
        console.log('Server is shutting down...');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
