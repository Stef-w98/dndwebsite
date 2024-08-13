require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// Middleware to parse JSON requests with larger limits
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Use sessions
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use true if using HTTPS
}));

// Serve static files with cache control
const staticOptions = {
    maxAge: '30d', // Cache static assets for 30 days
    setHeaders: (res, path) => {
        if (path.endsWith('Dryle.png')) {
            res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days in seconds
        }
    },
};

app.use(express.static(path.join(__dirname, 'public'), staticOptions));

app.use('/assets/images', express.static(path.join(__dirname, 'public/assets/images'), {
    maxAge: '365d' // Cache for 1 year
}));

app.use('/lib/map/assets/maps', express.static(path.join(__dirname, 'public/lib/map/assets/maps'), {
    maxAge: '365d' // Cache for 1 year
}));

// CORS configuration
app.use(cors({
    origin: 'https://www.dungeonsandmuffins.be', // Allow only this origin
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true
}));

// Import routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const mapRoutes = require('./routes/map');
const weatherRoutes = require('./routes/weather');
const uploadRoutes = require('./routes/upload'); // New route file for uploads

app.use('/api', authRoutes);
app.use('/api', dataRoutes);
app.use('/api', mapRoutes);
app.use('/api', weatherRoutes);
app.use('/api', uploadRoutes);

console.log('Routes setup complete');

// Start the server
const PORT = process.env.PORT || 3000;
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
